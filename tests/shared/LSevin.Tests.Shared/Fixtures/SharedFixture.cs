using System.Collections.Concurrent;
using System.Data.Common;
using System.Net.Http.Headers;
using System.Security.Claims;
using Ardalis.GuardClauses;
using AutoBogus;
using AutoMapper;
using Bogus;
using BuildingBlocks.Caching.Extensions;
using BuildingBlocks.Caching.Services;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Web.Constants;
using BuildingBlocks.Security.Jwt.Services;
using BuildingBlocks.Web.Modules;
using FluentAssertions.Extensions;
using Grpc.Core;
using Grpc.Core.Testing;
using Grpc.Net.Client;
using LSevin.Tests.Shared.Auth;
using LSevin.Tests.Shared.Extensions;
using LSevin.Tests.Shared.Factory;
using LSevin.Tests.Shared.Helpers;
using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NSubstitute.ClearExtensions;
using Quartz;
using Serilog;
using WireMock.Server;
using Xunit.Sdk;

namespace LSevin.Tests.Shared.Fixtures;

/// <summary>
/// Represents a shared fixture.
/// </summary>
/// <typeparam name="TEntryPoint">The type of the entry point.</typeparam>
public class SharedFixture<TEntryPoint> : IAsyncLifetime
    where TEntryPoint : class
{
    /// <summary>
    /// The message sink.
    /// </summary>
    private readonly IMessageSink _messageSink;

    /// <summary>
    /// The HTTP context accessor.
    /// </summary>
    private IHttpContextAccessor? _httpContextAccessor;

    /// <summary>
    /// The service provider.
    /// </summary>
    private IServiceProvider? _serviceProvider;

    /// <summary>
    /// The configuration.
    /// </summary>
    private IConfiguration? _configuration;

    /// <summary>
    /// The normal gRPC client.
    /// </summary>
    private HttpClient? _normalGrpcClient;

    /// <summary>
    /// The guest gRPC client.
    /// </summary>
    private HttpClient? _guestGrpcClient;

    /// <summary>
    /// The admin HTTP client.
    /// </summary>
    private HttpClient? _adminClient;

    /// <summary>
    /// The normal HTTP client.
    /// </summary>
    private HttpClient? _normalClient;

    /// <summary>
    /// The guest HTTP client.
    /// </summary>
    private HttpClient? _guestClient;

    /// <summary>
    /// Gets the faker for the test.
    /// </summary>
    public readonly Faker Faker = new();

    /// <summary>
    /// The mock services.
    /// </summary>
    private readonly ConcurrentDictionary<Type, object> _mockServices;

    /// <summary>
    /// The on shared fixture initialized.
    /// </summary>
    public Func<Task>? OnSharedFixtureInitialized;

    /// <summary>
    /// The on shared fixture disposed.
    /// </summary>
    public Func<Task>? OnSharedFixtureDisposed;

    /// <summary>
    /// Gets the logger.
    /// </summary>
    public ILogger Logger { get; }

    /// <summary>
    /// Gets the SQLs container fixture.
    /// </summary>
    public PostgresContainerFixture PostgresContainerFixture { get; }

    /// <summary>
    /// Gets the Redis container fixture.
    /// </summary>
    public RedisContainerFixture RedisContainerFixture { get; }

    /// <summary>
    /// Gets the factory.
    /// </summary>
    public CustomWebApplicationFactory<TEntryPoint> Factory { get; private set; }

    /// <summary>
    /// Gets the service provider.
    /// </summary>
    public IServiceProvider ServiceProvider => _serviceProvider ??= Factory.Services;

    /// <summary>
    /// Gets the configuration.
    /// </summary>
    public IConfiguration Configuration => _configuration ??= ServiceProvider.GetRequiredService<IConfiguration>();

    /// <summary>
    /// Gets the HTTP context accessor.
    /// </summary>
    public IHttpContextAccessor HttpContextAccessor =>
        _httpContextAccessor ??= ServiceProvider.GetRequiredService<IHttpContextAccessor>();

    /// <summary>
    /// Gets the HTTP client for the normal client.
    /// </summary>
    public HttpClient NormalGrpcClient
    {
        get
        {
            if (_normalGrpcClient is not null)
            {
                return _normalGrpcClient;
            }

            var claims = CreateNormalUserMock().Claims;
            _normalGrpcClient = Factory.CreateClient();

            _normalGrpcClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue(RequestHeaderConstValues.ApplicationGrpcContent)
            );

            _normalGrpcClient.SetFakeJwtBearerClaims(claims);

            return _normalGrpcClient;
        }
    }

    /// <summary>
    /// Gets the HTTP client for the guest client.
    /// </summary>
    public HttpClient GuestGrpcClient
    {
        get
        {
            if (_guestGrpcClient is not null)
            {
                return _guestGrpcClient;
            }

            _guestGrpcClient = Factory.CreateClient();

            _guestGrpcClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue(RequestHeaderConstValues.ApplicationGrpcContent)
            );

            return _guestGrpcClient;
        }
    }

    /// <summary>
    /// Gets we should not dispose this GuestClient, because we reuse it in our tests.
    /// </summary>
    public HttpClient GuestClient
    {
        get
        {
            if (_guestClient is not null)
            {
                return _guestClient;
            }

            _guestClient = Factory.CreateClient();

            _guestClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue(RequestHeaderConstValues.ApplicationJsonContent)
            );

            return _guestClient;
        }
    }

    /// <summary>
    /// Gets we should not dispose this AdminHttpClient, because we reuse it in our tests.
    /// </summary>
    public HttpClient AdminHttpClient => _adminClient ??= CreateAdminHttpClient();

    /// <summary>
    /// Gets we should not dispose this NormalUserHttpClient, because we reuse it in our tests.
    /// </summary>
    public HttpClient NormalUserHttpClient => _normalClient ??= CreateNormalUserHttpClient();

    /// <summary>
    /// Gets the wire mock server.
    /// </summary>
    public WireMockServer WireMockServer { get; }

    /// <summary>
    /// Gets the wire mock server url.
    /// </summary>
    public string WireMockServerAddress { get; }

    /// <summary>
    /// Gets and sets the normal grpc channel.
    /// </summary>
    public GrpcChannel NormalGrpcChannel =>
        GrpcChannel.ForAddress(NormalGrpcClient.BaseAddress!, new GrpcChannelOptions { HttpClient = NormalGrpcClient });

    /// <summary>
    /// Gets and sets the normal grpc channel.
    /// </summary>
    public GrpcChannel GuestGrpcChannel =>
        GrpcChannel.ForAddress(GuestGrpcClient.BaseAddress!, new GrpcChannelOptions { HttpClient = GuestGrpcClient });

    /// <summary>
    /// Initializes a new instance of the <see cref="SharedFixture{TEntryPoint}"/> class.
    /// </summary>
    /// <param name="messageSink">The message sink.</param>
    public SharedFixture(IMessageSink messageSink)
    {
        _messageSink = messageSink;
        messageSink.OnMessage(new DiagnosticMessage("Constructing SharedFixture..."));

        Logger = new LoggerConfiguration()
            .MinimumLevel.Verbose()
            .WriteTo.TestOutput(messageSink)
            .CreateLogger()
            .ForContext<SharedFixture<TEntryPoint>>();

        PostgresContainerFixture = new PostgresContainerFixture(messageSink);
        RedisContainerFixture = new RedisContainerFixture(messageSink);

        _mockServices = new ConcurrentDictionary<Type, object>();

        AutoFaker.Configure(b => b.WithRecursiveDepth(3).WithTreeDepth(1).WithRepeatCount(1));

        AssertionOptions.AssertEquivalencyUsing(options =>
        {
            options
                .Using<DateTime>(ctx => ctx.Subject.Should().BeCloseTo(ctx.Expectation, 1.Seconds()))
                .WhenTypeIs<DateTime>();

            options
                .Using<DateTimeOffset>(ctx => ctx.Subject.Should().BeCloseTo(ctx.Expectation, 1.Seconds()))
                .WhenTypeIs<DateTimeOffset>();

            return options;
        });

        WireMockServer = WireMockServer.Start();
        WireMockServerAddress = WireMockServer.Url!;

        Factory = new CustomWebApplicationFactory<TEntryPoint>();
    }

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        _messageSink.OnMessage(new DiagnosticMessage("SharedFixture Started..."));

        await Factory.InitializeAsync();
        await PostgresContainerFixture.InitializeAsync();
        await RedisContainerFixture.InitializeAsync();

        Factory.AddOverrideEnvKeyValues(
            new Dictionary<string, string>
            {
                {
                    $"ConnectionStrings:{EfConstants.SqlConnectionStringName}",
                    PostgresContainerFixture.Container.GetConnectionString()
                },
                { "ConnectionStrings:cache", $"{RedisContainerFixture.Container.GetConnectionString()}" },
            }
        );

        Factory.AddOverrideInMemoryConfig(new Dictionary<string, string>(StringComparer.Ordinal));
        Factory.ConfigurationAction += cfg => cfg["WireMockUrl"] = WireMockServerAddress;

        var initCallback = OnSharedFixtureInitialized?.Invoke();

        if (initCallback != null)
        {
            await initCallback;
        }
    }

    /// <inheritdoc />
    public async Task DisposeAsync()
    {
        await PostgresContainerFixture.DisposeAsync();
        await RedisContainerFixture.DisposeAsync();
        WireMockServer.Stop();
        AdminHttpClient.Dispose();
        NormalUserHttpClient.Dispose();
        GuestClient.Dispose();

        var disposeCallback = OnSharedFixtureDisposed?.Invoke();

        if (disposeCallback != null)
        {
            await disposeCallback;
        }

        await Factory.DisposeAsync();

        _messageSink.OnMessage(new DiagnosticMessage("SharedFixture Stopped..."));
    }

    /// <summary>
    /// Cleans up the messaging.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task CleanupMessaging(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    /// <summary>
    /// Resets the databases.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ResetDatabasesAsync(CancellationToken cancellationToken = default)
    {
        await PostgresContainerFixture.ResetDbAsync(cancellationToken);
        await RedisContainerFixture.CleanupAsync();

        await ExecuteScopeAsync(sp =>
        {
            var cache = sp.GetService<IMemoryCache>();

            if (cache is MemoryCache memoryCache)
            {
                memoryCache.Compact(1.0);
            }

            return Task.CompletedTask;
        });

        await ExecuteScopeAsync(async scope =>
        {
            var seeders = scope.GetServices<IDbSeeder>();

            foreach (var seeder in seeders)
            {
                await seeder.SeedAsync(cancellationToken);
            }
        });
    }

    /// <summary>
    /// We could use `WithWebHostBuilder` method for specific config and customize existing `CustomWebApplicationFactory`.
    /// </summary>
    /// <param name="builder">The builder.</param>
    /// <returns>The <see cref="CustomWebApplicationFactory{TEntryPoint}"/>.</returns>
    public CustomWebApplicationFactory<TEntryPoint> WithWebHostBuilder(Action<IWebHostBuilder> builder)
    {
        Factory = Factory.WithWebHostBuilder(builder);
        return Factory;
    }

    /// <summary>
    /// Withs the host builder.
    /// </summary>
    /// <param name="builder">The builder.</param>
    /// <returns>The <see cref="CustomWebApplicationFactory{TEntryPoint}"/>.</returns>
    public CustomWebApplicationFactory<TEntryPoint> WithHostBuilder(Action<IHostBuilder> builder)
    {
        Factory = Factory.WithHostBuilder(builder);
        return Factory;
    }

    /// <summary>
    /// Withs the configure app configurations.
    /// </summary>
    /// <param name="cfg">The configuration builder.</param>
    /// <returns>The <see cref="CustomWebApplicationFactory{TEntryPoint}"/>.</returns>
    public CustomWebApplicationFactory<TEntryPoint> WithConfigureAppConfigurations(
        Action<HostBuilderContext, IConfigurationBuilder> cfg
    )
    {
        Factory.WithConfigureAppConfigurations(cfg);
        return Factory;
    }

    /// <summary>
    /// Configures the test configure app.
    /// </summary>
    /// <param name="configBuilder">The configuration builder.</param>
    public void ConfigureTestConfigureApp(Action<HostBuilderContext, IConfigurationBuilder>? configBuilder)
    {
        if (configBuilder is not null)
        {
            Factory.TestConfigureApp += configBuilder;
        }
    }

    /// <summary>
    /// Configures the test services.
    /// </summary>
    /// <param name="services">The services.</param>
    public void ConfigureTestServices(Action<IServiceCollection>? services)
    {
        if (services is not null)
        {
            Factory.TestConfigureServices += services;
        }
    }

    /// <summary>
    /// Sets the output helper.
    /// </summary>
    /// <param name="outputHelper">The output helper.</param>
    public void SetOutputHelper(ITestOutputHelper outputHelper)
    {
        Factory.SetOutputHelper(outputHelper);
    }

    /// <summary>
    /// Sets the user.
    /// </summary>
    /// <param name="isAdmin">The value indicating whether the user is admin or not.</param>
    public void SetUserOnly(bool isAdmin = false)
    {
        new HttpContextBuilder()
            .WithClaims(isAdmin ? CreateAdminUserMock().Claims : CreateNormalUserMock().Claims)
            .Build(HttpContextAccessor);
    }

    /// <summary>
    /// Creates gRPC metadata with specified configuration.
    /// </summary>
    /// <returns>The configured Metadata.</returns>
    public Metadata CreateGrpcMetadata()
    {
        var builder = new GrpcMetadataBuilder().WithLanguage();

        return builder.Build();
    }

    /// <summary>
    /// Executes the scope asynchronous.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteScopeAsync<T>(Func<IServiceProvider, T> action)
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        return action(scope.ServiceProvider);
    }

    /// <summary>
    /// Executes the scope asynchronous.
    /// </summary>
    /// <param name="action">The action.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ExecuteScopeAsync(Func<IServiceProvider, Task> action)
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        await action(scope.ServiceProvider);
    }

    /// <summary>
    /// Executes the scope asynchronous.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteScopeAsync<T>(Func<IServiceProvider, Task<T>> action)
    {
        await using var scope = ServiceProvider.CreateAsyncScope();

        var result = await action(scope.ServiceProvider);

        return result;
    }

    /// <summary>
    /// Executes the mapping asynchronous.
    /// </summary>
    /// <typeparam name="TSource">The type of the source.</typeparam>
    /// <typeparam name="TDestination">The type of the destination.</typeparam>
    /// <param name="source">The source.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<TDestination> ExecuteMappingAsync<TSource, TDestination>(TSource source)
        where TSource : class
        where TDestination : class
    {
        return ExecuteScopeAsync<TDestination>(sp =>
        {
            var mapper = sp.GetRequiredService<IMapper>();
            return mapper.Map<TDestination>(source);
        });
    }

    /// <summary>
    /// Executes the specified action within a database connection.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task ExecuteDapperCommandAsync(
        Func<DbConnection, Task> action,
        CancellationToken cancellationToken = default
    )
    {
        return ExecuteScopeAsync(async sp =>
        {
            await using var connection = await sp.GetRequiredService<IDbConnectionFactory>()
                .GetOrCreateConnectionAsync(cancellationToken);

            await action(connection);
        });
    }

    /// <summary>
    /// Gets the user identity.
    /// </summary>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<Guid> GetUserIdentityAsync()
    {
        return ExecuteScopeAsync(sp =>
        {
            var userAccessor = sp.GetRequiredService<IUserAccessor>();
            return userAccessor.GetUserIdentity;
        });
    }

    /// <summary>
    /// Sends the asynchronous.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<TResponse> SendAsync<TResponse>(
        IRequest<TResponse> request,
        CancellationToken cancellationToken = default
    )
    {
        return ExecuteScopeAsync(sp =>
        {
            var mediator = sp.GetRequiredService<IMediator>();

            return mediator.Send(request, cancellationToken);
        });
    }

    /// <summary>
    /// Sends the asynchronous.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <typeparam name="TModule">The type of the module.</typeparam>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<Result<TResponse>> SendAsync<TResponse, TModule>(
        ICommand<TResponse> request,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull
        where TModule : class, IModuleDefinition
    {
        return ExecuteScopeAsync(sp =>
        {
            var commandBus = sp.GetRequiredService<IGatewayProcessor<TModule>>();

            return commandBus.SendCommandAsync(request, cancellationToken);
        });
    }

    /// <summary>
    /// Queries the asynchronous.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <typeparam name="TModule">The type of the module.</typeparam>
    /// <param name="query">The query.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<Result<TResponse>> QueryAsync<TResponse, TModule>(
        IQuery<TResponse> query,
        CancellationToken cancellationToken = default
    )
        where TResponse : class
        where TModule : class, IModuleDefinition
    {
        return ExecuteScopeAsync(sp =>
        {
            var queryProcessor = sp.GetRequiredService<IGatewayProcessor<TModule>>();

            return queryProcessor.SendQueryAsync(query, cancellationToken);
        });
    }

    /// <summary>
    /// Publishes the integration event asynchronous.
    /// </summary>
    /// <typeparam name="TMessage">The type of the message.</typeparam>
    /// <param name="message">The message.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task PublishIntegrationEventAsync<TMessage>(TMessage message, CancellationToken cancellationToken = default)
        where TMessage : class, IIntegrationEvent
    {
        return ExecuteScopeAsync(async sp =>
        {
            var bus = sp.GetRequiredService<IEventBus>();

            await bus.PublishAsync(message, cancellationToken: cancellationToken);
        });
    }

    /// <summary>
    /// Asserts the eventually that a probe is satisfied.
    /// </summary>
    /// <param name="probe">The probe.</param>
    /// <param name="timeoutSecond">The timeout.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task AssertEventually(IProbe probe, int? timeoutSecond = null, CancellationToken cancellationToken = default)
    {
        var time = timeoutSecond ?? Constants.Timeouts.DefaultTimeoutMs;
        return new Poller(time).CheckAsync(probe);
    }

    /// <summary>
    /// Waits until condition met.
    /// </summary>
    /// <param name="conditionToMet">The condition to meet.</param>
    /// <param name="timeoutMs">The timeout millisecond.</param>
    /// <param name="exception">The exception to throw.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<bool> WaitUntilConditionMet(
        Func<Task<bool>> conditionToMet,
        int? timeoutMs = null,
        string? exception = null,
        CancellationToken cancellationToken = default
    )
    {
        var time = timeoutMs ?? Constants.Timeouts.DefaultTimeoutMs;

        var startTime = SystemClock.Now;
        var timeoutExpired = false;
        var meet = await conditionToMet.Invoke();

        while (!meet)
        {
            if (timeoutExpired)
            {
                throw new TimeoutException(
                    exception ?? $"Condition not met for the test in the '{timeoutExpired}' second."
                );
            }

            await Task.Delay(Constants.Timeouts.DefaultPollingIntervalMs, cancellationToken);
            meet = await conditionToMet.Invoke();
            timeoutExpired = SystemClock.Now - startTime > TimeSpan.FromSeconds(time);
        }

        return meet;
    }

    /// <summary>
    /// Waits until the outbox message is persisted.
    /// </summary>
    /// <typeparam name="TMessage">The type of the message.</typeparam>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<bool> ShouldProcessedOutboxPersistMessage<TMessage>(CancellationToken cancellationToken = default)
        where TMessage : class, IDomainEvent
    {
        return WaitUntilConditionMet(
            () =>
            {
                return ExecuteScopeAsync(async _ => false);
            },
            cancellationToken: cancellationToken
        );
    }

    /// <summary>
    /// Gets cached data for a query.
    /// </summary>
    /// <typeparam name="TResponse">The type of the cached response.</typeparam>
    /// <param name="query">The query object.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The cached data.</returns>
    public Task<TResponse?> GetCachedQueryDataAsync<TResponse>(
        ICacheableQuery query,
        CancellationToken cancellationToken = default
    )
        where TResponse : class
    {
        var cacheService = ServiceProvider.GetService<ICachingService>();
        Guard.Against.Null(cacheService, nameof(cacheService));

        var cacheKey = query.GenerateCacheKey(HttpContextAccessor);

        return cacheService.GetAsync<TResponse>(cacheKey, cancellationToken);
    }

    /// <summary>
    /// Gets cached data for a query.
    /// </summary>
    /// <typeparam name="TResponse">The type of the cached response.</typeparam>
    /// <param name="cacheKey">The cache key.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The cached data.</returns>
    public Task<TResponse?> GetCachedDataAsync<TResponse>(
        string cacheKey,
        CancellationToken cancellationToken = default
    )
    {
        var cacheService = ServiceProvider.GetService<ICachingService>();
        Guard.Against.Null(cacheService, nameof(cacheService));

        return cacheService.GetAsync<TResponse>(cacheKey, cancellationToken);
    }

    /// <summary>
    /// Sets the cache.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="cacheKey">The cache key.</param>
    /// <param name="value">The value.</param>
    /// <param name="expiration">The expiration.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The <see cref="Task"/> that represents the asynchronous operation.</returns>
    public Task SetCacheAsync<TResponse>(
        string cacheKey,
        TResponse value,
        TimeSpan expiration,
        CancellationToken cancellationToken = default
    )
    {
        var cacheService = ServiceProvider.GetService<ICachingService>();
        Guard.Against.Null(cacheService, nameof(cacheService));

        return cacheService.SetAsync(cacheKey, value, expiration, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Gets the scheduler instance using scoped execution.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    public Task<IScheduler> GetSchedulerAsync(CancellationToken cancellationToken = default)
    {
        return ExecuteScopeAsync(async sp =>
        {
            var factory = sp.GetRequiredService<ISchedulerFactory>();
            var scheduler = await factory.GetScheduler(cancellationToken);
            return scheduler;
        });
    }

    /// <summary>
    /// Triggers a job immediately.
    /// </summary>
    /// <typeparam name="TJob">The type of the job to trigger.</typeparam>
    public Task TriggerJobAsync<TJob>(CancellationToken cancellationToken = default)
        where TJob : IJob
    {
        return ExecuteScopeAsync(async sp =>
        {
            var scheduler = await sp.GetRequiredService<ISchedulerFactory>().GetScheduler(cancellationToken);

            var jobKey = new JobKey(typeof(TJob).FullName!);
            await scheduler.TriggerJob(jobKey, cancellationToken);
        });
    }

    /// <summary>
    /// Gets job details.
    /// </summary>
    /// <typeparam name="TJob">The type of the job.</typeparam>
    public Task<IJobDetail?> GetJobAsync<TJob>(CancellationToken cancellationToken = default)
        where TJob : IJob
    {
        return ExecuteScopeAsync(async sp =>
        {
            var scheduler = await sp.GetRequiredService<ISchedulerFactory>().GetScheduler(cancellationToken);

            var jobKey = new JobKey(typeof(TJob).FullName!);
            return await scheduler.GetJobDetail(jobKey, cancellationToken);
        });
    }

    /// <summary>
    /// Gets triggers for a job.
    /// </summary>
    /// <typeparam name="TJob">The type of the job.</typeparam>
    public Task<IReadOnlyCollection<ITrigger>> GetJobTriggersAsync<TJob>(CancellationToken cancellationToken = default)
        where TJob : IJob
    {
        return ExecuteScopeAsync(async sp =>
        {
            var scheduler = await sp.GetRequiredService<ISchedulerFactory>().GetScheduler(cancellationToken);

            var jobKey = new JobKey(typeof(TJob).FullName!);
            return await scheduler.GetTriggersOfJob(jobKey, cancellationToken);
        });
    }

    /// <summary>
    /// Gets the next fire time for a job.
    /// </summary>
    /// <typeparam name="TJob">The type of the job.</typeparam>
    public async Task<DateTimeOffset?> GetNextFireTimeAsync<TJob>(CancellationToken cancellationToken = default)
        where TJob : IJob
    {
        var triggers = await GetJobTriggersAsync<TJob>(cancellationToken);
        return triggers.FirstOrDefault()?.GetNextFireTimeUtc();
    }

    /// <summary>
    /// Waits for a job to complete execution.
    /// </summary>
    /// <typeparam name="TJob">The type of the job.</typeparam>
    public Task WaitForJobCompletionAsync<TJob>(int? timeoutMs = null, CancellationToken cancellationToken = default)
        where TJob : IJob
    {
        return WaitUntilConditionMet(
            async () =>
            {
                var executing = await ExecuteScopeAsync(async sp =>
                {
                    var scheduler = await sp.GetRequiredService<ISchedulerFactory>().GetScheduler(cancellationToken);

                    var jobKey = new JobKey(typeof(TJob).FullName!);

                    var currentJobs = await scheduler.GetCurrentlyExecutingJobs(cancellationToken);

                    return !currentJobs.Any(x => x.JobDetail.Key.Equals(jobKey));
                });

                return executing;
            },
            timeoutMs,
            cancellationToken: cancellationToken
        );
    }

    /// <summary>
    /// Creates an async unary call.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="response">The response.</param>
    /// <returns>The async unary call.</returns>
    public AsyncUnaryCall<TResponse> CreateAsyncUnaryCall<TResponse>(TResponse response)
        where TResponse : class
    {
        return TestCalls.AsyncUnaryCall(
            Task.FromResult(response),
            Task.FromResult(new Metadata()),
            () => Status.DefaultSuccess,
            () => [],
            () => { }
        );
    }

    /// <summary>
    /// Gets the mock for the specified type.
    /// </summary>
    /// <typeparam name="TMock">The type of the mock.</typeparam>
    /// <returns>The mock.</returns>
    public TMock GetOrCreateMock<TMock>()
        where TMock : class
    {
        return (TMock)_mockServices.GetOrAdd(typeof(TMock), _ => Substitute.For<TMock>());
    }

    /// <summary>
    /// Resets all mocks.
    /// </summary>
    public void ResetMocks()
    {
        foreach (var mock in _mockServices.Values)
        {
            mock.ClearSubstitute();
        }
    }

    /// <summary>
    /// Gets the logged-in user ID.
    /// </summary>
    /// <param name="isAdmin">The value indicating whether the user is admin.</param>
    /// <returns>The logged-in user ID.</returns>
    public Guid GetLoggedInUserId(bool isAdmin = false)
    {
        var userId = isAdmin ? Constants.Users.Admin.UserId : Constants.Users.NormalUser.UserId;
        return Guid.Parse(userId);
    }

    #region Privates

    /// <summary>
    /// Creates the admin HTTP client.
    /// </summary>
    /// <returns>The HTTP client.</returns>
    private HttpClient CreateAdminHttpClient()
    {
        var adminClient = Factory.CreateClient();

        adminClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue(RequestHeaderConstValues.ApplicationJsonContent)
        );

        var claims = CreateAdminUserMock().Claims;

        adminClient.SetFakeJwtBearerClaims(claims);

        return adminClient;
    }

    /// <summary>
    /// Creates the normal user HTTP client.
    /// </summary>
    /// <returns>The HTTP client.</returns>
    private HttpClient CreateNormalUserHttpClient()
    {
        var userClient = Factory.CreateClient();

        userClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue(RequestHeaderConstValues.ApplicationJsonContent)
        );

        var claims = CreateNormalUserMock().Claims;

        userClient.SetFakeJwtBearerClaims(claims);

        return userClient;
    }

    /// <summary>
    /// Creates the admin user mock.
    /// </summary>
    /// <returns>The mock user.</returns>
    private static MockAuthUser CreateAdminUserMock()
    {
        var roleClaim = new Claim(ClaimTypes.Role, Constants.Users.Admin.Role);

        List<Claim> otherClaims =
        [
            new(ClaimTypes.NameIdentifier, Constants.Users.Admin.UserId),
            new(ClaimTypes.Name, Constants.Users.Admin.UserName),
            new(ClaimTypes.Email, Constants.Users.Admin.Email),
        ];

        return _ = new MockAuthUser([.. otherClaims, roleClaim]);
    }

    /// <summary>
    /// Creates the normal user mock.
    /// </summary>
    /// <returns>The mock user.</returns>
    private static MockAuthUser CreateNormalUserMock()
    {
        List<Claim> otherClaims =
        [
            new(ClaimTypes.NameIdentifier, Constants.Users.NormalUser.UserId),
            new(ClaimTypes.Name, Constants.Users.NormalUser.UserName),
            new(ClaimTypes.Email, Constants.Users.NormalUser.Email),
        ];

        return _ = new MockAuthUser([.. otherClaims]);
    }

    #endregion
}
