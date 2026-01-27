namespace BuildingBlocks.Caching.Services;

/// <summary>
/// Defines a contract for a caching service.
/// </summary>
public interface ICachingService
{
    /// <summary>
    /// Gets a cached value by key.
    /// </summary>
    /// <typeparam name="T">The type of the cached value.</typeparam>"
    /// <param name="key">The key of the cached value.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The cached value.</returns>
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets a cached value by key.
    /// </summary>
    /// <typeparam name="T">The type of the cached value.</typeparam>
    /// <param name="key">The key of the cached value.</param>
    /// <param name="value">The cached value.</param>
    /// <param name="expiration">The expiration time.</param>
    /// <param name="tags">The tags of the cached value.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The <see cref="Task"/> that represents the asynchronous operation.</returns>
    Task SetAsync<T>(
        string key,
        T value,
        TimeSpan expiration,
        List<string>? tags = null,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Removes a cached value by key.
    /// </summary>
    /// <param name="key">The key of the cached value.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The <see cref="Task"/> that represents the asynchronous operation.</returns>
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes all cached values by keys.
    /// </summary>
    /// <param name="keys">The keys of the cached values.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The <see cref="Task"/> that represents the asynchronous operation.</returns>
    Task RemoveAllAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes all cached values by tag.
    /// </summary>
    /// <param name="tag">The tag of the cached values.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The <see cref="Task"/> that represents the asynchronous operation.</returns>
    Task RemoveByTagAsync(string tag, CancellationToken cancellationToken = default);
}
