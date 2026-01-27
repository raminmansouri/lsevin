namespace BuildingBlocks.Caching.Utilities;

/// <summary>
/// Represents the cache key.
/// </summary>
public static class CacheKey
{
    /// <summary>
    /// Creates a cache key from the given keys.
    /// </summary>
    /// <param name="keys">The keys.</param>
    /// <returns>The cache key.</returns>
    public static string With(params string[] keys)
    {
        return string.Join('-', keys);
    }

    /// <summary>
    /// Creates a cache key from the given keys.
    /// </summary>
    /// <param name="ownerType">The owner type.</param>
    /// <param name="keys">The keys.</param>
    /// <returns>The cache key.</returns>
    public static string With(string ownerType, string[] keys)
    {
        return With($"{ownerType}:{string.Join('-', keys)}");
    }
}
