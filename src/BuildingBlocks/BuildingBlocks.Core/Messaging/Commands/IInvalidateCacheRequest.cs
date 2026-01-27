namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Provides an interface to implement cache invalidation capabilities on requests.
/// </summary>
public interface IInvalidateCacheRequest
{
    /// <summary>
    /// Gets the cache keys to invalidate.
    /// </summary>
    IReadOnlyCollection<string> CacheKeys { get; }

    /// <summary>
    /// Gets a value indicating whether to append request headers to cache keys.
    /// </summary>
    bool AppendRequestHeaders { get; }
}
