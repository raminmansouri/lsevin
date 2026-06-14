namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Provides an interface to implement caching capabilities on queries.
/// </summary>
public interface ICacheableQuery
{
    /// <summary>
    /// Gets a value indicating whether caching is enabled.
    /// </summary>
    bool IsCacheEnabled { get; }

    /// <summary>
    /// Gets the cache duration for the implementing query.
    /// </summary>
    TimeSpan CacheDuration { get; }

    /// <summary>
    /// Gets the cache key for the implementing query.
    /// </summary>
    string CacheKey { get; }

    /// <summary>
    /// Gets a value indicating whether to append request headers to cache key.
    /// </summary>
    bool AppendRequestHeaders { get; }
}
