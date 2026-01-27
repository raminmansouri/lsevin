namespace BuildingBlocks.Core.Resiliency.Options;

/// <summary>
/// Represents the options for a policy. This class is used to configure the resiliency policies.
/// </summary>
public sealed class PolicyOptions
{
    /// <summary>
    /// Gets or sets the bulkhead policy options.
    /// </summary>
    public BulkheadPolicyOptions BulkheadPolicyOptions { get; set; } = new();

    /// <summary>
    /// Gets or sets the circuit breaker policy options.
    /// </summary>
    public CircuitBreakerPolicyOptions CircuitBreakerPolicyOptions { get; set; } = new();

    /// <summary>
    /// Gets or sets the retry policy options.
    /// </summary>
    public RetryPolicyOptions RetryPolicyOptions { get; set; } = new();

    /// <summary>
    /// Gets or sets the timeout policy options.
    /// </summary>
    public TimeoutPolicyOptions TimeoutPolicyOptions { get; set; } = new();
}
