using BuildingBlocks.Caching.Extensions;
using BuildingBlocks.Caching.Options;
using BuildingBlocks.Caching.Services;
using BuildingBlocks.Core.Messaging.Queries;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Caching.Middlewares;

/// <summary>
/// Caching behavior for handling cacheable queries in the MediatR pipeline.
/// </summary>
/// <typeparam name="TRequest">The type of the request.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="CachingBehavior{TRequest, TResponse}"/> class.
/// </remarks>
/// <param name="httpContextAccessor">The HTTP context accessor.</param>
/// <param name="cachingService">The caching service.</param>
/// <param name="cacheOptions">The cache options.</param>
/// <param name="logger">The logger.</param>
public sealed class CachingBehavior<TRequest, TResponse>(
    IHttpContextAccessor httpContextAccessor,
    ICachingService cachingService,
    IOptions<CacheOptions> cacheOptions,
    ILogger<CachingBehavior<TRequest, TResponse>> logger
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : ICacheableQuery
    where TResponse : notnull
{
    private readonly CacheOptions _cacheOptions = cacheOptions.Value;

    #region Handler

    /// <inheritdoc />
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var configurationCachingEnabled = _cacheOptions.Enabled;
        if (!configurationCachingEnabled || !request.IsCacheEnabled)
        {
            return await next(cancellationToken);
        }

        var cacheKey = request.GenerateCacheKey(httpContextAccessor);
        var cachedResponse = await cachingService.GetAsync<TResponse>(cacheKey, cancellationToken);

        if (cachedResponse is not null)
        {
            logger.LogInformation(
                "[Caching MediatR Query] - Cache hit for {RequestType} with key {CacheKey}",
                request.GetType().Name,
                cacheKey
            );

            return cachedResponse;
        }

        logger.LogInformation(
            "[Caching MediatR Query] - Cache miss for {RequestType} with key {CacheKey}",
            request.GetType().Name,
            cacheKey
        );

        var response = await next(cancellationToken);

        var cacheTimeInMinutes =
            request.CacheDuration == TimeSpan.Zero
                ? TimeSpan.FromMinutes(_cacheOptions.QueryCacheTimeInMinutes)
                : request.CacheDuration;
        await cachingService.SetAsync(
            cacheKey,
            response,
            expiration: cacheTimeInMinutes,
            cancellationToken: cancellationToken
        );

        logger.LogInformation(
            "[Caching MediatR Query] - Cache set for {RequestType} with key {CacheKey}",
            request.GetType().Name,
            cacheKey
        );

        return response;
    }

    #endregion
}
