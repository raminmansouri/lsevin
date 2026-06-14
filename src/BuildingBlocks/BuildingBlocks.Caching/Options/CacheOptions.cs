namespace BuildingBlocks.Caching.Options;

/// <summary>
/// Represents the settings for the caching configuration.
/// </summary>
public sealed class CacheOptions
{
    /// <summary>
    /// Gets the query cache time in minutes.
    /// </summary>
    public int QueryCacheTimeInMinutes { get; init; }

    /// <summary>
    /// Gets the auth config cache time in minutes.
    /// </summary>
    public int AuthConfigCacheTimeInMinutes { get; init; }

    /// <summary>
    /// Gets a value indicating whether it gets the flag indicating whether the cache is enabled.
    /// </summary>
    public bool Enabled { get; init; }
}
