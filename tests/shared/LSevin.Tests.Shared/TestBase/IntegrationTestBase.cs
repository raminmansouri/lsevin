using BuildingBlocks.Core.Clock;
using LSevin.Tests.Shared.Fixtures;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace LSevin.Tests.Shared.TestBase;

/// <summary>
/// Represents the base class for integration tests.
/// </summary>
public abstract class IntegrationTestBase<TEntryPoint> : XunitContextBase, IAsyncLifetime
    where TEntryPoint : class
{
    /// <summary>
    /// Represents the cancellation token source.
    /// </summary>
    private IServiceScope? _serviceScope;

    /// <summary>
    /// Gets represents the cancellation token.
    /// </summary>
    protected CancellationToken CancellationToken => CancellationTokenSource.Token;

    /// <summary>
    /// Gets represents the cancellation token source.
    /// </summary>
    protected CancellationTokenSource CancellationTokenSource { get; }

    /// <summary>
    /// Gets represents the timeout.
    /// </summary>
    protected int Timeout => 180;

    /// <summary>
    /// Gets represents the service scope.
    /// </summary>
    protected IServiceScope Scope => _serviceScope ??= SharedFixture.ServiceProvider.CreateScope();

    /// <summary>
    /// Gets represents the shared fixture.
    /// </summary>
    protected SharedFixture<TEntryPoint> SharedFixture { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="IntegrationTestBase{TEntryPoint}"/> class.
    /// </summary>
    /// <param name="sharedFixture">The shared fixture.</param>
    /// <param name="outputHelper">The output helper.</param>
    protected IntegrationTestBase(SharedFixture<TEntryPoint> sharedFixture, ITestOutputHelper outputHelper)
        : base(outputHelper)
    {
        SharedFixture = sharedFixture;
        SharedFixture.SetOutputHelper(outputHelper);

        CancellationTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(Timeout));
        CancellationToken.ThrowIfCancellationRequested();

        SharedFixture.ConfigureTestServices(services =>
        {
            RegisterTestConfigureServices(services);
        });

        SharedFixture.ConfigureTestConfigureApp(
            (context, configurationBuilder) =>
                RegisterTestAppConfigurations(configurationBuilder, context.Configuration, context.HostingEnvironment)
        );

        SharedFixture.WithWebHostBuilder(ConfigureWebHost);
    }

    /// <inheritdoc />
    public virtual Task InitializeAsync()
    {
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public virtual async Task DisposeAsync()
    {
        await SharedFixture.CleanupMessaging(CancellationToken);
        await SharedFixture.ResetDatabasesAsync(CancellationToken);
        SharedFixture.WireMockServer.Reset();

        await CancellationTokenSource.CancelAsync();

        SystemClock.Reset();

        Scope.Dispose();
    }

    /// <summary>
    /// Gets or sets configures the web host builder.
    /// </summary>
    protected virtual void ConfigureWebHost(IWebHostBuilder hostBuilder) { }

    /// <summary>
    /// Registers the test configure services.
    /// </summary>
    /// <param name="services">The services.</param>
    protected virtual void RegisterTestConfigureServices(IServiceCollection services) { }

    /// <summary>
    /// Registers the test app configurations.
    /// </summary>
    /// <param name="builder">The builder.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="environment">The environment.</param>
    protected virtual void RegisterTestAppConfigurations(
        IConfigurationBuilder builder,
        IConfiguration configuration,
        IHostEnvironment environment
    ) { }
}

/// <summary>
/// Represents the base class for integration tests.
/// </summary>
/// <typeparam name="TEntryPoint">The type of the entry point.</typeparam>
/// <typeparam name="TContext">The type of the database context.</typeparam>
public abstract class IntegrationTestBase<TEntryPoint, TContext>(
    SharedFixtureWithEfCore<TEntryPoint, TContext> sharedFixture,
    ITestOutputHelper outputHelper
) : IntegrationTestBase<TEntryPoint>(sharedFixture, outputHelper)
    where TEntryPoint : class
    where TContext : DbContext
{
    /// <summary>
    /// Gets the shared fixture.
    /// </summary>
    protected new SharedFixtureWithEfCore<TEntryPoint, TContext> SharedFixture { get; } = sharedFixture;
}
