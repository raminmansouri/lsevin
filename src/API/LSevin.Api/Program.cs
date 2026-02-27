using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.FileUpload.Extensions;
using BuildingBlocks.Core.Logging.Extensions;
using BuildingBlocks.Core.Logging.Middlewares;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Web.Extensions;
using BuildingBlocks.OpenTelemetry;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Security.Jwt.Extensions;
using BuildingBlocks.Security.Jwt.Models;
using BuildingBlocks.Security.Xss.Middlewares;
using BuildingBlocks.Web.Extensions;
using BuildingBlocks.Web.HeaderPropagation;
using BuildingBlocks.Web.Middlewares;
using BuildingBlocks.Web.Modules;
using BuildingBlocks.Web.Modules.Extensions;
using BuildingBlocks.Web.OpenApi;
using BuildingBlocks.Web.ProblemDetail.Extensions;
using BuildingBlocks.Web.RateLimit;
using Serilog;
using Serilog.Events;
using CategoryModule = LSevin.Modules.Category.CategoryReference;
using CustomerModule = LSevin.Modules.Customer.CustomerReference;
using Environments = BuildingBlocks.Core.Web.Environments;
using IdentityModule = LSevin.Modules.Identity.IdentityReference;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override(
        "BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage.StoredMessageProcessor",
        LogEventLevel.Warning
    )
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} {Level} - {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseDefaultServiceProvider(
        (context, options) =>
        {
            var isDevMode =
                context.HostingEnvironment.IsDevelopment()
                || context.HostingEnvironment.IsEnvironment(Environments.Test)
                || context.HostingEnvironment.IsStaging();

            options.ValidateScopes = isDevMode;
            options.ValidateOnBuild = isDevMode;
        }
    );

    var configuration = builder.Configuration;
    var env = builder.Environment;

    var databaseConnectionString = configuration.GetConnectionStringOrThrow(EfConstants.SqlConnectionStringName);

    var redisConnectionString = configuration.GetConnectionStringOrThrow("cache");
    var eventStoreConnectionString = configuration.GetConnectionStringOrThrow("eventstore");

    var isDev = env.IsDevelopment();
    var isTest = env.IsTest();

    configuration.AddModulesSettingsFile(env.ContentRootPath);

    builder.Services.AddMemoryCache();

    builder.Services.AddHttpContextAccessor();

    builder.AddCustomObservability();

    builder.Services.AddBaseHealthCheck(databaseConnectionString, redisConnectionString, eventStoreConnectionString);

    if (isDev && isTest)
    {
        builder.AddCustomSerilog();
    }

    var modulesAssemblies = new[] { IdentityModule.Assembly, CustomerModule.Assembly, CategoryModule.Assembly };


    /*----------------- Module Services Setup ------------------*/
    builder.AddModulesServices(env, useCompositionRootForModules: true, modulesAssemblies);

    builder
        .Services.AddProblemDetails(o => o.CustomizeProblemDetails = context => context.Customize())
        .AddExceptionHandler<ExceptionHandler>()
        .AddCustomCors()
        .AddRequestTimeouts()
        .AddOutputCache()
        .AddResponseCaching()
        .AddServiceDiscoveryDefaults()
        .AddVersioningService()
        .AddCompression()
        .AddPropagation()
        .AddEndpointsApiExplorer()
        .AddAspnetOpenApi()
        .AddBaseAuthenticationService()
        .AddBaseAuthorizationService(
            rolePolicies:
            [
                new RolePolicy(SecurityConstants.Role.Admin, [SecurityConstants.Role.Admin]),
                new RolePolicy(SecurityConstants.Role.User, [SecurityConstants.Role.User]),
            ]
        )
        .AddCustomRateLimit(configuration);

    var app = builder.Build();

    if (isDev && isTest)
    {
        app.UseDeveloperExceptionPage();
    }
    else
    {
        app.UseHsts();
    }

    app.UseCustomCors();
    app.UseAspnetOpenApi();

    app.UseRouting();
    app.UseHttpsRedirection();

    app.UseFileUploadService(configuration, env);

    app.UseAuthentication().UseAuthorization();

    /*----------------- Module Middleware Setup ------------------*/
    await app.ConfigureModules();

    app.UseHeaderPropagation();

    app.UseCustomRateLimit();

    app.UseLocalization().UseExceptionHandler().UseStatusCodePages().UseMiddleware<XssMiddleware>();

    if (isDev && isTest)
    {
        app.UseMiddleware<RequestLogContextMiddleware>()
            .UseMiddleware<UserContextEnrichmentMiddleware>()
            .UseSerilogRequestLogging();
    }

    app.UseRequestTimeouts();

    app.UseOutputCache().UseResponseCaching();

    /*----------------- Module Routes Setup ------------------*/
    app.MapModulesEndpoints();

    app.UseBaseEndPointServices();

    app.UseVersionedMinimalApis(modulesAssemblies);

    app.MapHealthCheckEndPoints();

    app.UseObservability();

    await using var _ = app.Lifetime.ApplicationStopping.Register(() =>
    {
        if (!isTest)
        {
            foreach (var compositionRoot in CompositionRootRegistry.CompositionRoots)
            {
                compositionRoot.ServiceProvider.StopHostedServices().GetAwaiter().GetResult();
            }
        }
    });

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
