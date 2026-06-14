namespace BuildingBlocks.Web.RateLimit;

/// <summary>
/// Represents the rate limit options.
/// </summary>
public sealed class RateLimitOptions
{
    /// <summary>
    /// Gets or sets the limit.
    /// </summary>
    public int Limit { get; set; }

    /// <summary>
    /// Gets or sets the period in ms.
    /// </summary>
    public double PeriodInMs { get; set; }

    /// <summary>
    /// Gets or sets the queue limit.
    /// </summary>
    public int QueueLimit { get; set; }
}
