using BuildingBlocks.Core.ResultPattern;
using MediatR;

namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Represents the query interface.
/// </summary>
/// <typeparam name="TQuery">The query type.</typeparam>
/// <typeparam name="TResponse">The query response type.</typeparam>
public interface IQueryHandler<in TQuery, TResponse> : IRequestHandler<TQuery, Result<TResponse>>
    where TQuery : IQuery<TResponse>;
