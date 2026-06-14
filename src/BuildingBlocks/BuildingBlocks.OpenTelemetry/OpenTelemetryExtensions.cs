using System.Diagnostics;
using System.Reflection;
using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Observability;
using BuildingBlocks.Core.Observability.CoreDiagnostics.Commands;
using BuildingBlocks.Core.Observability.CoreDiagnostics.Query;
using BuildingBlocks.Core.Observability.Diagnostics;
using BuildingBlocks.Core.Observability.Options;
using BuildingBlocks.Core.Web.Extensions;
using EventStore.Client.Extensions.OpenTelemetry;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace BuildingBlocks.OpenTelemetry;

/// <summary>
/// Extension methods for configuring and adding pre-configured presentation-related services.
/// </summary>
public static class OpenTelemetryExtensions
{
    private const string AspNetCoreHosting = "Microsoft.AspNetCore.Hosting";
    private const string AspNetCoreServerKestrel = "Microsoft.AspNetCore.Server.Kestrel";
    private const string DotnetSockets = "System.Net.Sockets";
    private const string DotnetSecurity = "System.Net.Security";
    private const string DotnetRuntime = "System.Runtime";
    private const string YarpReversProxy = "Yarp.ReverseProxy";

    /// <summary>
    /// Adds pre-configured presentation-related services to the DI container.
    /// </summary>
    /// <param name="builder">The WebApplicationBuilder instance to configure.</param>
    /// <param name="configureOptions">An optional delegate to configure the ObservabilityOptions.</param>
    /// <returns>The configured WebApplicationBuilder instance.</returns>
    public static WebApplicationBuilder AddCustomObservability(
        this WebApplicationBuilder builder,
        Action<ObservabilityOptionsConfigurator>? configureOptions = null
    )
    {
        Activity.DefaultIdFormat = ActivityIdFormat.W3C;
        builder.Services.AddSingleton<IDiagnosticsProvider, DiagnosticsProvider>();
        builder.AddCoreDiagnostics();

        builder.Services.AddConfigurationOptions<ObservabilityOptions>(nameof(ObservabilityOptions));

        var observabilityOptions = builder.Configuration.BindOptions<ObservabilityOptions>();

        ArgumentException.ThrowIfNullOrEmpty(observabilityOptions.InstrumentationName);
        ObservabilityConstant.InstrumentationName = observabilityOptions.InstrumentationName;

        var optionsConfigurations = new ObservabilityOptionsConfigurator();
        configureOptions?.Invoke(optionsConfigurations);

        if (observabilityOptions is { MetricsEnabled: false, TracingEnabled: false, LoggingEnabled: false })
        {
            return builder;
        }

        if (observabilityOptions.LoggingEnabled)
        {
            builder.Logging.AddOpenTelemetry(options =>
            {
                var resourceBuilder = ResourceBuilder.CreateDefault();
                ConfigureResourceBuilder(resourceBuilder);
                options.SetResourceBuilder(resourceBuilder);

                options.IncludeFormattedMessage = true;
                options.IncludeScopes = true;
                options.ParseStateValues = true;
                // which means the message wouldn't have the placeholders replaced
                options.IncludeFormattedMessage = true;

                // add some metadata to exported logs
                options.SetResourceBuilder(
                    ResourceBuilder
                        .CreateDefault()
                        .AddService(
                            observabilityOptions.ServiceName ?? builder.Environment.ApplicationName,
                            serviceVersion: Assembly.GetCallingAssembly().GetName().Version?.ToString() ?? "unknown",
                            serviceInstanceId: Environment.MachineName
                        )
                );

                options.AddLoggingExporters(observabilityOptions);
            });
        }

        if (observabilityOptions is { MetricsEnabled: false, TracingEnabled: false })
        {
            return builder;
        }

        OpenTelemetryBuilder otel = null!;

        if (observabilityOptions.MetricsEnabled || observabilityOptions.TracingEnabled)
        {
            // metrics and tracing
            otel = builder.Services.AddOpenTelemetry();
            otel.ConfigureResource(ConfigureResourceBuilder);
        }

        if (observabilityOptions.MetricsEnabled)
        {
            otel.WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddProcessInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddMeter(observabilityOptions.InstrumentationName, DotnetSockets, DotnetSecurity)
                    .AddView(
                        "http.server.request.duration",
                        new ExplicitBucketHistogramConfiguration
                        {
                            Boundaries = [0, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10],
                        }
                    )
                    .AddMeter(DotnetRuntime)
                    .AddMeter(AspNetCoreHosting)
                    .AddMeter(AspNetCoreServerKestrel);

                AddMetricsExporter(observabilityOptions, metrics);

                optionsConfigurations.ConfigureMeterProvider?.Invoke(metrics);
            });
        }

        if (observabilityOptions.TracingEnabled)
        {
            otel.WithTracing(tracing =>
            {
                if (builder.Environment.IsDevelopment())
                {
                    tracing.SetSampler(new AlwaysOnSampler());
                }

                tracing
                    .SetErrorStatusOnException()
                    .AddAspNetCoreInstrumentation(options => options.RecordException = true)
                    .AddGrpcClientInstrumentation()
                    .AddHttpClientInstrumentation(instrumentationOptions =>
                        instrumentationOptions.RecordException = true
                    )
                    .AddEntityFrameworkCoreInstrumentation(instrumentationOptions =>
                        instrumentationOptions.SetDbStatementForText = true
                    )
                    .AddSqlClientInstrumentation(o => o.SetDbStatementForText = true)
                    .AddSource(YarpReversProxy)
                    .AddSource(ObservabilityConstant.ActivitySourceNames.Migration)
                    .AddNpgsql()
                    .AddRedisInstrumentation()
                    .AddQuartzInstrumentation()
                    .AddEventStoreClientInstrumentation()
                    .AddSource(observabilityOptions.InstrumentationName)
                    .AddSource(AspNetCoreHosting)
                    .AddSource(AspNetCoreServerKestrel);

                AddTracingExporter(observabilityOptions, tracing);

                optionsConfigurations.ConfigureTracerProvider?.Invoke(tracing);
            });
        }

        return builder;

        void ConfigureResourceBuilder(ResourceBuilder resourceBuilder)
        {
            resourceBuilder.AddAttributes(
                [new KeyValuePair<string, object>("service.environment", builder.Environment.EnvironmentName)]
            );

            resourceBuilder.AddService(
                serviceName: observabilityOptions.ServiceName ?? builder.Environment.ApplicationName,
                serviceVersion: Assembly.GetCallingAssembly().GetName().Version?.ToString() ?? "unknown",
                serviceInstanceId: Environment.MachineName
            );
        }
    }

    private static void AddTracingExporter(ObservabilityOptions observabilityOptions, TracerProviderBuilder tracing)
    {
        if (observabilityOptions.UseJaegerExporter)
        {
            ArgumentNullException.ThrowIfNull(observabilityOptions.JaegerOptions);

            tracing.AddOtlpExporter(x =>
            {
                x.Endpoint = new Uri(observabilityOptions.JaegerOptions.OTLPGrpcExporterEndpoint);

                x.Protocol = OtlpExportProtocol.Grpc;
            });
        }

        if (observabilityOptions.UseAspireOTLPExporter)
        {
            tracing.AddOtlpExporter();
        }
    }

    private static void AddMetricsExporter(ObservabilityOptions observabilityOptions, MeterProviderBuilder metrics)
    {
        if (observabilityOptions.UseJaegerExporter)
        {
            ArgumentNullException.ThrowIfNull(observabilityOptions.JaegerOptions);

            metrics.AddOtlpExporter(x =>
            {
                x.Endpoint = new Uri(observabilityOptions.JaegerOptions.OTLPGrpcExporterEndpoint);

                x.Protocol = OtlpExportProtocol.Grpc;
            });
        }

        if (observabilityOptions.UseAspireOTLPExporter)
        {
            metrics.AddOtlpExporter();
        }
    }

    /// <summary>
    /// Adds the logging exporters to the service collection.
    /// </summary>
    /// <param name="openTelemetryLoggerOptions">The OpenTelemetryLoggerOptions instance to configure.</param>
    /// <param name="observabilityOptions">The ObservabilityOptions instance to configure.</param>
    private static void AddLoggingExporters(
        this OpenTelemetryLoggerOptions openTelemetryLoggerOptions,
        ObservabilityOptions observabilityOptions
    )
    {
        if (observabilityOptions.UseJaegerExporter)
        {
            ArgumentNullException.ThrowIfNull(observabilityOptions.JaegerOptions);

            openTelemetryLoggerOptions.AddOtlpExporter(x =>
            {
                x.Endpoint = new Uri(observabilityOptions.JaegerOptions.OTLPGrpcExporterEndpoint);

                x.Protocol = OtlpExportProtocol.Grpc;
            });
        }

        if (observabilityOptions.UseAspireOTLPExporter)
        {
            openTelemetryLoggerOptions.AddOtlpExporter();
        }
    }

    /// <summary>
    /// Adds the core diagnostics.
    /// </summary>
    /// <param name="builder">The builder.</param>
    /// <returns>The configured builder.</returns>
    private static WebApplicationBuilder AddCoreDiagnostics(this WebApplicationBuilder builder)
    {
        builder.Services.AddTransient<CommandHandlerActivity>();
        builder.Services.AddTransient<CommandHandlerMetrics>();
        builder.Services.AddTransient<QueryHandlerActivity>();
        builder.Services.AddTransient<QueryHandlerMetrics>();

        return builder;
    }

    /// <summary>
    /// Adds pre-configured presentation-related services to the DI container.
    /// </summary>
    /// <param name="app">The WebApplication instance to configure.</param>
    /// <returns>The configured WebApplication instance.</returns>
    public static WebApplication UseObservability(this WebApplication app)
    {
        _ = app.Services.GetRequiredService<IOptions<ObservabilityOptions>>().Value;

        app.Use(
            async (context, next) =>
            {
                var metricsFeature = context.Features.Get<IHttpMetricsTagsFeature>();
                if (metricsFeature != null && context.Request.Path is { Value: "/metrics" or "/health" })
                {
                    metricsFeature.MetricsDisabled = true;
                }

                await next(context);
            }
        );

        return app;
    }
}
