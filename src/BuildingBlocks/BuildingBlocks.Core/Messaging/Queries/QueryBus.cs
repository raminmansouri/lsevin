using BuildingBlocks.Core.ResultPattern;
using MediatR;

namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Represents the query bus.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="QueryBus"/> class.
/// </remarks>
/// <param name="mediator">The mediator.</param>
internal sealed class QueryBus(ISender mediator) : IQueryBus
{
    /// <inheritdoc />
    public async Task<Result<TResponse>> SendAsync<TResponse>(
        IQuery<TResponse> query,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull
    {
        var result = await mediator.Send(query, cancellationToken).ConfigureAwait(false);
        return result;
    }
}
