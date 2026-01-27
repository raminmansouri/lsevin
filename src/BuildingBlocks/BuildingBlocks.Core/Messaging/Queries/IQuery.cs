using BuildingBlocks.Core.ResultPattern;
using MediatR;

namespace BuildingBlocks.Core.Messaging.Queries;

/// <summary>
/// Represents the query interface.
/// </summary>
/// <typeparam name="TResponse">The query result type.</typeparam>
public interface IQuery<TResponse> : IRequest<Result<TResponse>>, IBaseQuery;
