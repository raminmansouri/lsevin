namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the list query.
/// </summary>
/// <typeparam name="TResponse">The type of the response.</typeparam>
public interface IListQuery<TResponse> : IPageRequest, IQuery<TResponse>
    where TResponse : notnull;
