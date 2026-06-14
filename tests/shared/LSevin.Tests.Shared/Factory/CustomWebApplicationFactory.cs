using BuildingBlocks.Security.Jwt.Extensions;
using BuildingBlocks.Security.Jwt.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;
using WebMotions.Fake.Authentication.JwtBearer;
using Environments = BuildingBlocks.Core.Web.Environments;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace LSevin.Tests.Shared.Factory;

/// <summary>
/// A custom WebApplicationFactory for integration testing that provides additional configuration options
/// and test-specific services.
/// </summary>
/// <typeparam name="TEntryPoint">The entry point class of the web application.</typeparam>
public class CustomWebApplicationFactory<TEntryPoint> : WebApplicationFactory<TEntryPoint>, IAsyncLifetime
    where TEntryPoint : class
{
    /// <summary>
    /// Dictionary containing in-memory configuration key-value pairs.
    /// </summary>
    private readonly Dictionary<string, string?> _inMemoryConfigs = new(StringComparer.Ordinal);

    /// <summary>
    /// Helper for capturing and asserting test output.
    /// </summary>
    private ITestOutputHelper? _outputHelper;

    /// <summary>
    /// Custom configuration for the web host builder.
    /// </summary>
    private Action<IWebHostBuilder>? _customWebHostBuilder;

    /// <summary>
    /// Custom configuration for the host builder.
    /// </summary>
    private Action<IHostBuilder>? _customHostBuilder;

    /// <summary>
    /// Custom configuration for application configurations.
    /// </summary>
    private Action<HostBuilderContext, IConfigurationBuilder>? _configureAppConfigurations;

    /// <summary>
    /// Custom configuration for test services.
    /// </summary>
    private Action<IServiceCollection>? _testServices;

    /// <summary>
    /// Gets or sets the action to configure the application configuration.
    /// </summary>
    public Action<IConfiguration>? ConfigurationAction { get; set; }

    /// <summary>
    /// Gets or sets the action to configure test services.
    /// </summary>
    public Action<IServiceCollection>? TestConfigureServices { get; set; }

    /// <summary>
    /// Gets or sets the action to configure the test application.
    /// </summary>
    public Action<HostBuilderContext, IConfigurationBuilder>? TestConfigureApp { get; set; }

    /// <summary>
    /// Gets the logger instance for this factory.
    /// </summary>
    public ILogger Logger => Services.GetRequiredService<ILogger<CustomWebApplicationFactory<TEntryPoint>>>();

    /// <summary>
    /// Clears the current output helper.
    /// </summary>
    public void ClearOutputHelper() => _outputHelper = null;

    /// <summary>
    /// Sets the output helper for test logging.
    /// </summary>
    /// <param name="value">The test output helper instance.</param>
    public void SetOutputHelper(ITestOutputHelper value) => _outputHelper = value;

    /// <summary>
    /// Configures additional test services.
    /// </summary>
    /// <param name="services">The action to configure services.</param>
    /// <returns>The current factory instance.</returns>
    public CustomWebApplicationFactory<TEntryPoint> WithTestServices(Action<IServiceCollection> services)
    {
        _testServices += services;
        return this;
    }

    /// <summary>
    /// Configures additional application configurations.
    /// </summary>
    /// <param name="builder">The action to configure the application.</param>
    /// <returns>The current factory instance.</returns>
    public CustomWebApplicationFactory<TEntryPoint> WithConfigureAppConfigurations(
        Action<HostBuilderContext, IConfigurationBuilder> builder
    )
    {
        _configureAppConfigurations += builder;
        return this;
    }

    /// <summary>
    /// Configures the web host builder.
    /// </summary>
    /// <param name="builder">The action to configure the web host builder.</param>
    /// <returns>The current factory instance.</returns>
    public new CustomWebApplicationFactory<TEntryPoint> WithWebHostBuilder(Action<IWebHostBuilder> builder)
    {
        _customWebHostBuilder = builder;
        return this;
    }

    /// <summary>
    /// Configures the host builder.
    /// </summary>
    /// <param name="builder">The action to configure the host builder.</param>
    /// <returns>The current factory instance.</returns>
    public CustomWebApplicationFactory<TEntryPoint> WithHostBuilder(Action<IHostBuilder> builder)
    {
        _customHostBuilder = builder;
        return this;
    }

    /// <inheritdoc/>
    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Test);
        builder.UseContentRoot(".");

        builder.UseSerilog(
            (_, loggerConfiguration) =>
            {
                if (_outputHelper is not null)
                {
                    loggerConfiguration.WriteTo.TestOutput(
                        _outputHelper,
                        LogEventLevel.Information,
                        "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} {Level} - {Message:lj}{NewLine}{Exception}"
                    );
                }
            }
        );

        builder.UseDefaultServiceProvider(
            (env, c) =>
            {
                if (env.HostingEnvironment.IsEnvironment(Environments.Test) || env.HostingEnvironment.IsDevelopment())
                {
                    c.ValidateScopes = true;
                }
            }
        );

        builder.ConfigureAppConfiguration(
            (hostingContext, configurationBuilder) =>
            {
                configurationBuilder.AddInMemoryCollection(_inMemoryConfigs);

                ConfigurationAction?.Invoke(hostingContext.Configuration);
                _configureAppConfigurations?.Invoke(hostingContext, configurationBuilder);
                TestConfigureApp?.Invoke(hostingContext, configurationBuilder);
            }
        );

        _customHostBuilder?.Invoke(builder);

        return base.CreateHost(builder);
    }

    /// <inheritdoc/>
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = FakeJwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = FakeJwtBearerDefaults.AuthenticationScheme;
                })
                .AddFakeJwtBearer(c => c.BearerValueType = FakeJwtBearerBearerValueType.Jwt)
                .Services.AddBaseAuthorizationService(
                    rolePolicies: [new RolePolicy(nameof(Constants.Users.Admin), ["admin"])],
                    scheme: FakeJwtBearerDefaults.AuthenticationScheme
                );

            _testServices?.Invoke(services);
            TestConfigureServices?.Invoke(services);
        });

        _customWebHostBuilder?.Invoke(builder);

        base.ConfigureWebHost(builder);
    }

    /// <inheritdoc/>
    public Task InitializeAsync()
    {
        return Task.CompletedTask;
    }

    /// <inheritdoc/>
    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
    }

    /// <summary>
    /// Adds an in-memory configuration override.
    /// </summary>
    /// <param name="key">The configuration key.</param>
    /// <param name="value">The configuration value.</param>
    public void AddOverrideInMemoryConfig(string key, string value)
    {
        _inMemoryConfigs.Add(key, value);
    }

    /// <summary>
    /// Adds multiple in-memory configuration overrides.
    /// </summary>
    /// <param name="inMemConfigs">Dictionary of configuration key-value pairs.</param>
    public void AddOverrideInMemoryConfig(IDictionary<string, string> inMemConfigs)
    {
        inMemConfigs.ToList().ForEach(x => _inMemoryConfigs.Add(x.Key, x.Value));
    }

    /// <summary>
    /// Adds an environment variable override.
    /// </summary>
    /// <param name="key">The environment variable key.</param>
    /// <param name="value">The environment variable value.</param>
    public void AddOverrideEnvKeyValue(string key, string value)
    {
        Environment.SetEnvironmentVariable(key, value);
    }

    /// <summary>
    /// Adds multiple environment variable overrides.
    /// </summary>
    /// <param name="keyValues">Dictionary of environment variable key-value pairs.</param>
    public void AddOverrideEnvKeyValues(IDictionary<string, string> keyValues)
    {
        foreach (var (key, value) in keyValues)
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
