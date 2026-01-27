using MediatR;
using Microsoft.Extensions.Logging;
using Polly;

namespace BuildingBlocks.Core.Resiliency.Fallback;

/// <summary>
/// MediatR Fallback Pipeline Behavior.
/// </summary>
/// <typeparam name="TRequest">The request type.</typeparam>
/// <typeparam name="TResponse">The response type.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="FallbackBehavior{TRequest, TResponse}"/> class.
/// </remarks>
/// <param name="fallbackHandlers">The fallback handlers.</param>
/// <param name="logger">The logger.</param>
public sealed class FallbackBehavior<TRequest, TResponse>(
    IEnumerable<IFallbackHandler<TRequest, TResponse>> fallbackHandlers,
    ILogger<FallbackBehavior<TRequest, TResponse>> logger
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : notnull
{
    /// <inheritdoc />
    public Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var fallbackHandler = fallbackHandlers.FirstOrDefault();
        if (fallbackHandler == null)
        {
            return next(cancellationToken);
        }

        var fallbackPolicy = Policy<TResponse>
            .Handle<Exception>()
            .FallbackAsync(_ =>
            {
                logger.LogDebug(
                    "Initial handler failed. Falling back to `{FullName}@HandleFallback`",
                    fallbackHandler.GetType().FullName
                );
                return fallbackHandler.HandleFallbackAsync(request, cancellationToken);
            });

        return fallbackPolicy.ExecuteAsync(() => next());
    }
}
