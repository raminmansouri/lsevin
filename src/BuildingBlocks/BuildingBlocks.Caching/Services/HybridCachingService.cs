using Microsoft.Extensions.Caching.Hybrid;

namespace BuildingBlocks.Caching.Services;

/// <summary>
/// Provides a caching service for testing purposes.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="HybridCachingService"/> class.
/// </remarks>
/// <param name="cache">The cache.</param>
public class HybridCachingService(HybridCache cache) : ICachingService
{
    /// <inheritdoc />
    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var result = await cache
            .GetOrCreateAsync<T>(
                key,
                factory: _ => default,
                options: new HybridCacheEntryOptions { Flags = HybridCacheEntryFlags.DisableUnderlyingData },
                cancellationToken: cancellationToken
            )
            .ConfigureAwait(false);
        return result ?? default;
    }

    /// <inheritdoc />
    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan expiration,
        List<string>? tags = null,
        CancellationToken cancellationToken = default
    )
    {
        await cache
            .SetAsync(
                key,
                value,
                options: new HybridCacheEntryOptions { Expiration = expiration, LocalCacheExpiration = expiration },
                tags: tags,
                cancellationToken: cancellationToken
            )
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        await cache.RemoveAsync(key, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task RemoveAllAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default)
    {
        await cache.RemoveAsync(keys, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task RemoveByTagAsync(string tag, CancellationToken cancellationToken = default)
    {
        await cache.RemoveByTagAsync(tag, cancellationToken).ConfigureAwait(false);
    }
}
