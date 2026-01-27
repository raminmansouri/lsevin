namespace BuildingBlocks.Core.Logging.Options;

/// <summary>
/// Represents the Serilog options.
/// </summary>
public sealed class SerilogOptions
{
    /// <summary>
    /// Gets or sets the Seq URL.
    /// </summary>
    public string? SeqUrl { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether to use console.
    /// </summary>
    public bool UseConsole { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to export logs to OpenTelemetry.
    /// </summary>
    public bool ExportLogsToOpenTelemetry { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to log template.
    /// </summary>
    public string LogTemplate { get; set; } =
        "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} {Level} - {Message:lj}{NewLine}{Exception}";

    /// <summary>
    /// Gets or sets the log path.
    /// </summary>
    public string? LogPath { get; set; }
}
