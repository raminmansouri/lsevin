namespace BuildingBlocks.Core.Resiliency.Options;

/// <summary>
/// Represents the resiliency type.
/// </summary>
public enum ResiliencyType
{
    /// <summary>
    /// Represents a shared resiliency policy that can be reused across multiple components.
    /// </summary>
    Shared = 0,

    /// <summary>
    /// Represents a custom resiliency policy specific to a single component.
    /// </summary>
    Custom = 1,
}
