using BuildingBlocks.Caching.Extensions;
using BuildingBlocks.Caching.Services;
using BuildingBlocks.Core.Messaging.Commands;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Caching.Middlewares;

/// <summary>
/// Invalidate caching behavior for handling cache invalidation requests in the MediatR pipeline.
/// </summary>
/// <typeparam name="TRequest">The type of the request.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="InvalidateCachingBehavior{TRequest, TResponse}"/> class.
/// </remarks>
/// <param name="httpContextAccessor">The HTTP context accessor.</param>
/// <param name="cachingService">The caching service.</param>
/// <param name="logger">The logger.</param>
public sealed class InvalidateCachingBehavior<TRequest, TResponse>(
    IHttpContextAccessor httpContextAccessor,
    ICachingService cachingService,
    ILogger<InvalidateCachingBehavior<TRequest, TResponse>> logger
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IInvalidateCacheRequest
    where TResponse : notnull
{
    /// <inheritdoc />
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        if (request.CacheKeys.Count == 0)
        {
            return await next(cancellationToken);
        }

        var response = await next(cancellationToken);

        var keysToInvalidate = request.GenerateCacheKeysToInvalidate(httpContextAccessor);

        await cachingService.RemoveAllAsync(keysToInvalidate, cancellationToken);

        logger.LogInformation(
            "[Invalidate Caching MediatR Command] - Cache invalidated for {RequestType} with keys: {CacheKeys}",
            request.GetType().Name,
            string.Join(", ", keysToInvalidate)
        );

        return response;
    }
}
