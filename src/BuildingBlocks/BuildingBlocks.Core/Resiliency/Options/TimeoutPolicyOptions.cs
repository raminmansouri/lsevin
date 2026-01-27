namespace BuildingBlocks.Core.Resiliency.Options;

/// <summary>
/// Represents the options for the timeout policy.
/// </summary>
public sealed class TimeoutPolicyOptions
{
    /// <summary>
    /// Gets or sets the timeout in seconds.
    /// </summary>
    public int TimeoutInSeconds { get; set; } = 30;
}
