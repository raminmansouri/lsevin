using Ardalis.GuardClauses;
using BuildingBlocks.Core.Generators;

namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the command interface.
/// </summary>
/// <typeparam name="TResponse">The command response type.</typeparam>
public abstract record Command<TResponse> : ICommand<TResponse>, IInvalidateCacheRequest
    where TResponse : notnull
{
    private readonly List<string> _cacheKeys = [];

    /// <inheritdoc />
    public Guid Id { get; }

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheKeys => _cacheKeys.AsReadOnly();

    /// <inheritdoc />
    public bool AppendRequestHeaders { get; private set; } = true;

    /// <summary>
    /// Initializes a new instance of the <see cref="Command{TResponse}"/> class.
    /// Generates a new unique identifier for the command.
    /// </summary>
    protected Command()
    {
        Id = IdGenerator.NewId();
        Initialize();
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Command{TResponse}"/> class with the specified identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the command.</param>
    protected Command(Guid id)
    {
        Id = id;
        Initialize();
    }

    private void Initialize()
    {
        ConfigureCache();
    }

    /// <summary>
    /// Configures cache invalidation. Override this method to set up cache invalidation in derived classes.
    /// </summary>
    protected virtual void ConfigureCache() { }

    /// <summary>
    /// Adds a query type to invalidate its cache.
    /// </summary>
    /// <param name="queryType">The type of the query whose cache should be invalidated.</param>
    protected void AddQueryToInvalidate(Type queryType)
    {
        Guard.Against.Null(queryType, nameof(queryType));

        _cacheKeys.Add(queryType.Name);
    }

    /// <summary>
    /// Adds multiple query types to invalidate their caches.
    /// </summary>
    /// <param name="queryTypes">The types of the queries whose caches should be invalidated.</param>
    protected void AddQueriesToInvalidate(IEnumerable<Type> queryTypes)
    {
        var enumerable = queryTypes as Type[] ?? queryTypes.ToArray();
        Guard.Against.Null(enumerable, nameof(queryTypes));

        _cacheKeys.AddRange(enumerable.Select(t => t.Name));
    }

    /// <summary>
    /// Adds a cache key to invalidate.
    /// </summary>
    /// <param name="cacheKey">The cache key to invalidate.</param>
    protected void AddCacheKeyToInvalidate(string cacheKey)
    {
        Guard.Against.Empty(cacheKey, nameof(cacheKey));

        _cacheKeys.Add(cacheKey);
    }

    /// <summary>
    /// Adds multiple cache keys to invalidate.
    /// </summary>
    /// <param name="cacheKeys">The cache keys to invalidate.</param>
    protected void AddCacheKeysToInvalidate(IEnumerable<string> cacheKeys)
    {
        var enumerable = cacheKeys as string[] ?? cacheKeys.ToArray();
        Guard.Against.Null(enumerable, nameof(cacheKeys));

        _cacheKeys.AddRange(enumerable.Where(k => !string.IsNullOrEmpty(k)));
    }

    /// <summary>
    /// Sets whether to append request headers to cache keys.
    /// </summary>
    /// <param name="append">True to append headers, false otherwise.</param>
    protected void SetAppendRequestHeaders(bool append)
    {
        AppendRequestHeaders = append;
    }
}
