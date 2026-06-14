using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace BuildingBlocks.OpenTelemetry;

/// <summary>
/// Represents the observability options configurator.
/// </summary>
public class ObservabilityOptionsConfigurator
{
    /// <summary>
    /// Gets the configure tracer provider.
    /// </summary>
    public Action<TracerProviderBuilder>? ConfigureTracerProvider { get; private set; }

    /// <summary>
    /// Gets the configure meter provider.
    /// </summary>
    public Action<MeterProviderBuilder>? ConfigureMeterProvider { get; private set; }

    /// <summary>
    /// Gets the configure tracer provider.
    /// </summary>
    public ObservabilityOptionsConfigurator ConfigureTracing(Action<TracerProviderBuilder> configure)
    {
        ConfigureTracerProvider = configure;

        return this;
    }

    /// <summary>
    /// Gets the configure meter provider.
    /// </summary>
    public ObservabilityOptionsConfigurator ConfigureMetrics(Action<MeterProviderBuilder> configure)
    {
        ConfigureMeterProvider = configure;

        return this;
    }
}
