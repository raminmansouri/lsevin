namespace BuildingBlocks.Core.Observability.Options;

/// <summary>
/// Represents the observability options.
/// </summary>
public sealed class ObservabilityOptions
{
    /// <summary>
    /// Gets or sets the instrumentation name used to identify the source of telemetry data.
    /// </summary>
    public string InstrumentationName { get; set; } = null!;

    /// <summary>
    /// Gets or sets the optional service name for the application.
    /// </summary>
    public string? ServiceName { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether metrics collection is enabled. Defaults to true.
    /// </summary>
    public bool MetricsEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether distributed tracing is enabled. Defaults to true.
    /// </summary>
    public bool TracingEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether structured logging is enabled. Defaults to true.
    /// </summary>
    public bool LoggingEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use the Aspire OTLP exporter for telemetry. Defaults to true.
    /// </summary>
    public bool UseAspireOTLPExporter { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to use the Jaeger exporter for tracing.
    /// </summary>
    public bool UseJaegerExporter { get; set; }

    /// <summary>
    /// Gets or sets the Jaeger-specific configuration options.
    /// </summary>
    public JaegerOptions JaegerOptions { get; set; } = null!;
}

/// <summary>
/// Represents the jaeger options.
/// </summary>
public sealed class JaegerOptions
{
    /// <summary>
    /// Gets or sets the OTLP gRPC endpoint for Jaeger. Defaults to "http://localhost:14317".
    /// </summary>
    public string OTLPGrpcExporterEndpoint { get; set; } = "http://localhost:14317";

    /// <summary>
    /// Gets or sets the HTTP endpoint for Jaeger. Defaults to "http://localhost:14268/api/traces".
    /// </summary>
    public string HttpExporterEndpoint { get; set; } = "http://localhost:14268/api/traces";
}
