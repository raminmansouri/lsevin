namespace BuildingBlocks.Core.Resiliency.Options;

/// <summary>
/// Represents the options for the bulkhead policy.
/// </summary>
public sealed class BulkheadPolicyOptions
{
    /// <summary>
    /// Gets or sets the maximum number of parallel executions.
    /// </summary>
    public int MaxParallelization { get; set; } = 10;

    /// <summary>
    /// Gets or sets the maximum number of queued actions.
    /// </summary>
    public int MaxQueuingActions { get; set; } = 5;
}
