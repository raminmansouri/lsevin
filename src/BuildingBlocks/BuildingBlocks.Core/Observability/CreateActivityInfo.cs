using System.Diagnostics;

namespace BuildingBlocks.Core.Observability;

/// <summary>
/// Represents the creation activity information.
/// </summary>
public class CreateActivityInfo
{
    /// <summary>
    /// Gets or sets the name of the activity.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Gets or sets the start time of the activity.
    /// </summary>
    public IDictionary<string, object?> Tags { get; set; } = new Dictionary<string, object?>(StringComparer.Ordinal);

    /// <summary>
    /// Gets or sets the activity kind.
    /// </summary>
    public string? ParentId { get; set; }

    /// <summary>
    /// Gets or sets the parent activity.
    /// </summary>
    public ActivityContext? Parent { get; set; }

    /// <summary>
    /// Gets or sets the activity kind.
    /// </summary>
    public required ActivityKind ActivityKind = ActivityKind.Internal;
}
