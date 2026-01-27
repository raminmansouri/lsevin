using BuildingBlocks.Core.Generators;

namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Represents the query interface.
/// </summary>
/// <typeparam name="TResponse">The query result type.</typeparam>
public abstract record Query<TResponse> : IQuery<TResponse>
    where TResponse : notnull
{
    /// <summary>
    /// Gets initializes a new instance of the <see cref="Query{TResponse}"/> class.
    /// </summary>
    public Guid Id { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="Query{TResponse}"/> class.
    /// </summary>
    protected Query()
    {
        Id = IdGenerator.NewId();
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Query{TResponse}"/> class.
    /// </summary>
    /// <param name="id"></param>
    protected Query(Guid id)
    {
        Id = id;
    }
}
