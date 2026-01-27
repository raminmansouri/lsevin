using BuildingBlocks.Core.Generators;

namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the page query.
/// </summary>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="PageQuery{TResponse}"/> class.
/// </remarks>
public abstract record PageQuery<TResponse> : PageRequest, IPageQuery<TResponse>
    where TResponse : notnull
{
    /// <summary>
    /// Gets initializes a new instance of the <see cref="Query{TResponse}"/> class.
    /// </summary>
    public Guid Id { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="PageQuery{TResponse}"/> class.
    /// </summary>
    protected PageQuery()
    {
        Id = IdGenerator.NewId();
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="PageQuery{TResponse}"/> class.
    /// </summary>
    /// <param name="id"></param>
    protected PageQuery(Guid id)
    {
        Id = id;
    }
}
