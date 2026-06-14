namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the page query.
/// </summary>
/// <typeparam name="TResponse">The type of the response.</typeparam>
public interface IPageQuery<TResponse> : IPageRequest, IQuery<TResponse>
    where TResponse : notnull;
