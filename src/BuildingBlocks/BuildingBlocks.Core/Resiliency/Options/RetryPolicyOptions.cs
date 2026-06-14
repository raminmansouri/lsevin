namespace BuildingBlocks.Core.Resiliency.Options;

/// <summary>
/// Represents the options for the retry policy.
/// </summary>
public sealed class RetryPolicyOptions
{
    /// <summary>
    /// Gets or sets the number of retries.
    /// </summary>
    public int Count { get; set; } = 3;

    /// <summary>
    /// Gets or sets the backoff power.
    /// </summary>
    public int BackoffPower { get; set; } = 2;
}
