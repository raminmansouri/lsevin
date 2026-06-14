using BuildingBlocks.Core.Types;

namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Provides a base class for queries with caching capabilities.
/// </summary>
/// <typeparam name="TResponse">The type of the query result.</typeparam>
public abstract record CachedQuery<TResponse> : Query<TResponse>, ICacheableQuery
    where TResponse : notnull
{
    /// <summary>
    /// The cache key.
    /// </summary>
    private string _cacheKey;

    /// <summary>
    /// The cache duration.
    /// </summary>
    private TimeSpan _cacheDuration;

    /// <summary>
    /// Initializes a new instance of the <see cref="CachedQuery{TResponse}"/> class.
    /// </summary>
    protected CachedQuery()
    {
        IsCacheEnabled = true;
        AppendRequestHeaders = true;
        _cacheKey = string.Empty;
        _cacheDuration = TimeSpan.Zero;
    }

    /// <inheritdoc />
    public bool IsCacheEnabled { get; private set; }

    /// <inheritdoc />
    public virtual TimeSpan CacheDuration
    {
        get => _cacheDuration;
        protected set => _cacheDuration = value;
    }

    /// <inheritdoc />
    public virtual string CacheKey
    {
        get => _cacheKey;
        protected set => _cacheKey = value;
    }

    /// <inheritdoc />
    public bool AppendRequestHeaders { get; private set; }

    /// <summary>
    /// Disables caching for the implementing query.
    /// </summary>
    public void DisableCaching() => IsCacheEnabled = false;

    /// <summary>
    /// Sets whether to append request headers to cache key.
    /// </summary>
    /// <param name="append">True to append headers, false otherwise.</param>
    protected void SetAppendRequestHeaders(bool append)
    {
        AppendRequestHeaders = append;
    }

    /// <summary>
    /// Sets the cache duration for the implementing query.
    /// </summary>
    /// <param name="duration">The cache duration.</param>
    protected void SetCacheDuration(TimeSpan duration)
    {
        CacheDuration = duration;
    }

    /// <summary>
    /// Customizes the cache key for the implementing query.
    /// </summary>
    /// <param name="customKeyPart">The custom key part.</param>
    protected void CustomizeCacheKey(string customKeyPart)
    {
        CacheKey = $"{TypeMapper.GetFullTypeName(GetType())}:{customKeyPart}";
    }
}
