using MediatR;

namespace BuildingBlocks.Core.Resiliency.Fallback;

/// <summary>
/// Represents a fallback handler.
/// </summary>
/// <typeparam name="TRequest">The request type.</typeparam>
/// <typeparam name="TResponse">The response type.</typeparam>
public interface IFallbackHandler<in TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : notnull
{
    /// <summary>
    /// Handles the fallback operation.
    /// </summary>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The response.</returns>
    Task<TResponse> HandleFallbackAsync(TRequest request, CancellationToken cancellationToken);
}
