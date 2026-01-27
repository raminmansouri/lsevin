namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the list query.
/// </summary>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="ListQuery{TResponse}"/> class.
/// </remarks>
/// <param name="Includes">The includes.</param>
/// <param name="Sorts">The sorts.</param>
public abstract record ListQuery<TResponse>(IList<string>? Includes, IList<string>? Sorts)
    : PageRequest,
        IListQuery<TResponse>
    where TResponse : notnull;
