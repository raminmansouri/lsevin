using System.Globalization;
using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Logging.Options;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Enrichers.Span;
using Serilog.Exceptions;
using Serilog.Exceptions.Core;
using Serilog.Exceptions.EntityFrameworkCore.Destructurers;
using Serilog.Settings.Configuration;

namespace BuildingBlocks.Core.Logging.Extensions;

/// <summary>
/// Represents the logging extensions.
/// </summary>
public static class LoggingExtensions
{
    private const string EnvironmentEnrichmentKey = "Environment";
    private const string ApplicationEnrichmentKey = "Application";

    /// <summary>
    /// Adds the custom Serilog configuration.
    /// </summary>
    /// <param name="builder">The <see cref="WebApplicationBuilder"/> instance to configure.</param>
    /// <param name="extraConfigure">The extra configure delegate.</param>
    /// <returns>The configured <see cref="WebApplicationBuilder"/> instance.</returns>
    public static WebApplicationBuilder AddCustomSerilog(
        this WebApplicationBuilder builder,
        Action<LoggerConfiguration>? extraConfigure = null
    )
    {
        var serilogOptions = builder.Configuration.BindOptions<SerilogOptions>();
        builder.Logging.ClearProviders();
        builder.Services.AddSerilog(
            (_, loggerConfiguration) =>
            {
                var applicationName = builder
                    .Environment.ApplicationName.ToLower(CultureInfo.InvariantCulture)
                    .Replace('.', '-');
                var environmentName = builder
                    .Environment.EnvironmentName.ToLower(CultureInfo.InvariantCulture)
                    .Replace('.', '-');

                loggerConfiguration
                    .MinimumLevel.Information()
                    .Enrich.WithMachineName()
                    .Enrich.WithCorrelationIdHeader()
                    .Enrich.WithProcessId()
                    .Enrich.WithThreadId()
                    .Enrich.WithSpan()
                    .Enrich.FromLogContext()
                    .Enrich.WithExceptionDetails(
                        new DestructuringOptionsBuilder()
                            .WithDefaultDestructurers()
                            .WithDestructurers([new DbUpdateExceptionDestructurer()])
                    )
                    .Enrich.WithProperty(EnvironmentEnrichmentKey, environmentName)
                    .Enrich.WithProperty(ApplicationEnrichmentKey, applicationName)
                    .Enrich.WithBaggage();

                loggerConfiguration.ReadFrom.Configuration(
                    builder.Configuration,
                    new ConfigurationReaderOptions { SectionName = nameof(SerilogOptions) }
                );

                extraConfigure?.Invoke(loggerConfiguration);

                loggerConfiguration.WriteTo.Async(a =>
                {
                    if (serilogOptions.UseConsole)
                    {
                        a.Console();
                        a.Debug();
                    }

                    if (!string.IsNullOrEmpty(serilogOptions.SeqUrl))
                    {
                        a.Seq(serilogOptions.SeqUrl);
                    }
                });

                if (!string.IsNullOrEmpty(serilogOptions.LogPath))
                {
                    loggerConfiguration.WriteTo.Async(writeTo =>
                        writeTo.File(
                            serilogOptions.LogPath,
                            outputTemplate: serilogOptions.LogTemplate,
                            rollingInterval: RollingInterval.Day,
                            rollOnFileSizeLimit: true
                        )
                    );
                }
            },
            preserveStaticLogger: true,
            writeToProviders: serilogOptions.ExportLogsToOpenTelemetry
        );

        return builder;
    }
}
