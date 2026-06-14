using System.Diagnostics;

namespace BuildingBlocks.Core.Observability;

/// <summary>
/// Represents the activity information.
/// </summary>
public class ActivityInfo
{
    /// <summary>
    /// Gets or sets the name of the activity.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Gets or sets the start time of the activity.
    /// </summary>
    public DateTime StartTime { get; set; }

    /// <summary>
    /// Gets or sets the duration of the activity.
    /// </summary>
    public TimeSpan Duration { get; set; }

    /// <summary>
    /// Gets or sets the status of the activity.
    /// </summary>
    public string Status { get; set; } = null!;

    /// <summary>
    /// Gets or sets the status description of the activity.
    /// </summary>
    public string? StatusDescription { get; set; }

    /// <summary>
    /// Gets or sets the tags associated with the activity.
    /// </summary>
    public IDictionary<string, string?> Tags { get; set; } = new Dictionary<string, string?>(StringComparer.Ordinal);

    /// <summary>
    /// Gets or sets the events associated with the activity.
    /// </summary>
    public IList<ActivityEventInfo> Events { get; set; } = [];

    /// <summary>
    /// Gets or sets the trace ID of the activity.
    /// </summary>
    public string TraceId { get; set; } = null!;

    /// <summary>
    /// Gets or sets the span ID of the activity.
    /// </summary>
    public string SpanId { get; set; } = null!;

    /// <summary>
    /// Gets or sets the parent ID of the activity.
    /// </summary>
    public string? ParentId { get; set; }

    /// <summary>
    /// Gets or sets the parent activity context.
    /// </summary>
    public ActivityContext? Parent { get; set; }

    /// <summary>
    /// Gets or sets the kind of activity.
    /// </summary>
    public ActivityKind Kind { get; set; }
}

/// <summary>
/// Represents the activity event information.
/// </summary>
public class ActivityEventInfo
{
    /// <summary>
    /// Gets or sets the name of the activity event.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Gets or sets the timestamp of the activity event.
    /// </summary>
    public DateTimeOffset Timestamp { get; set; }

    /// <summary>
    /// Gets or sets the attributes associated with the activity event.
    /// </summary>
    public IDictionary<string, object?> Attributes { get; set; } = new Dictionary<string, object?>();
}
