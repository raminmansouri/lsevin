using System.IdentityModel.Tokens.Jwt;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Logging.Extensions;
using BuildingBlocks.Core.Logging.Middlewares;
using BuildingBlocks.Core.Web.Constants;
using BuildingBlocks.OpenTelemetry;
using BuildingBlocks.Web.Constants;
using BuildingBlocks.Web.Extensions;
using BuildingBlocks.Web.Middlewares;
using BuildingBlocks.Web.RateLimit;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using Serilog.Events;
using Yarp.ReverseProxy.Transforms;
using Environments = BuildingBlocks.Core.Web.Environments;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} {Level} - {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // The gateway receives and proxies media uploads, so its request-body limit must match the
    // API's (100 MB). Kestrel's ~28.6 MB default otherwise rejects videos before they reach the API.
    builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 104_857_600);

    var configuration = builder.Configuration;
    var isDev = builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment(Environments.Test);
    if (isDev)
    {
        builder.AddCustomSerilog();
    }

    JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
    builder
        .AddCustomObservability()
        .Services.AddHttpForwarderWithServiceDiscovery()
        .AddServiceDiscoveryDefaults()
        .AddCustomRateLimit(configuration)
        .AddReverseProxy()
        .LoadFromConfig(configuration.GetSection("ReverseProxy"))
        .AddTransforms(transforms =>
        {
            transforms.AddRequestTransform(transform =>
            {
                transform.ProxyRequest.Headers.Add(RequestHeaderConstValues.TraceId, IdGenerator.NewId().ToString());

                return ValueTask.CompletedTask;
            });
        })
        .AddServiceDiscoveryDestinationResolver();
    builder
        .Services.AddHealthChecks()
        .AddCheck(
            WebConstants.HealthChecks.HealthCheckName,
            () => HealthCheckResult.Healthy(),
            tags: [WebConstants.HealthChecks.HealthCheckLiveTag]
        )
        .AddUrlGroup(
            new Uri($"http://lsevin-api{WebConstants.OpenApi.ScalarRoute}/{WebConstants.OpenApi.DefaultVersion}"),
            "LSevin.Api",
            HealthStatus.Degraded
        );

    var app = builder.Build();

    if (isDev)
    {
        app.UseMiddleware<RequestLogContextMiddleware>()
            .UseMiddleware<UserContextEnrichmentMiddleware>()
            .UseSerilogRequestLogging();
    }

    app.MapHealthCheckEndPoints();
    app.MapReverseProxy();
    app.UseCustomRateLimit();

    app.MapGet("/", () => "Hello, From API Gateway!");

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}
