using BuildingBlocks.Core.ResultPattern;

namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Represents the query bus.
/// </summary>
public interface IQueryBus
{
    /// <summary>
    /// Sends the query asynchronously.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="query">The query.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task<Result<TResponse>> SendAsync<TResponse>(IQuery<TResponse> query, CancellationToken cancellationToken = default)
        where TResponse : notnull;
}
