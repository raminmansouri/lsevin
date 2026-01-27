using System.Security.Claims;
using System.Text;
using BuildingBlocks.Caching.Options;
using BuildingBlocks.Caching.Serialization;
using BuildingBlocks.Caching.Services;
using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Web.Constants;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Caching.Extensions;

/// <summary>
/// Provides extension methods for configuring caching.
/// </summary>
public static class CachingExtensions
{
    /// <summary>
    /// Adds the caching services.
    /// </summary>
    /// <param name="services">The services.</param>
    /// <param name="configuration">The configuration.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddCaching(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddValidatedOptions<CacheOptions>();
        var cache = configuration.GetConnectionStringOrThrow("cache");
        var cacheSettings = configuration.GetSettings<CacheOptions>(nameof(CacheOptions));

        services.AddStackExchangeRedisCache(options => options.Configuration = cache);
        services
            .AddHybridCache(options =>
            {
                options.MaximumPayloadBytes = 1024 * 1024 * 10; // 10MB
                options.MaximumKeyLength = 512;

                options.DefaultEntryOptions = new HybridCacheEntryOptions
                {
                    Expiration = TimeSpan.FromMinutes(cacheSettings.QueryCacheTimeInMinutes),
                    LocalCacheExpiration = TimeSpan.FromMinutes(cacheSettings.QueryCacheTimeInMinutes),
                };
            })
            .AddSerializerFactory<MessagePackHybridCacheSerializerFactory>();
        // .AddSerializerFactory<SystemTextJsonCacheSerializerFactory>();

        services.TryAddSingleton<ICachingService, HybridCachingService>();

        return services;
    }

    /// <summary>
    /// Generates a cache key for a cacheable query.
    /// </summary>
    /// <param name="query">The cacheable query.</param>
    /// <param name="httpContextAccessor">The HTTP context accessor.</param>
    /// <returns>The generated cache key.</returns>
    public static string GenerateCacheKey(this ICacheableQuery query, IHttpContextAccessor httpContextAccessor)
    {
        var userIdentifier =
            httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        var key = new StringBuilder($"{query.GetType().Name}");

        if (!string.IsNullOrEmpty(query.CacheKey))
        {
            key.Append($"_{query.CacheKey}");
        }

        key.Append($"_user:{userIdentifier}");

        if (query.AppendRequestHeaders && httpContextAccessor.HttpContext is not null)
        {
            AppendCustomHeaders(key, httpContextAccessor.HttpContext.Request.Headers);
        }

        return key.ToString();
    }

    /// <summary>
    /// Generates cache keys for cache invalidation request.
    /// </summary>
    /// <param name="request">The cache invalidation request.</param>
    /// <param name="httpContextAccessor">The HTTP context accessor.</param>
    /// <returns>The collection of cache keys to invalidate.</returns>
    public static IReadOnlySet<string> GenerateCacheKeysToInvalidate(
        this IInvalidateCacheRequest request,
        IHttpContextAccessor httpContextAccessor
    )
    {
        var keysToInvalidate = new HashSet<string>(StringComparer.Ordinal);
        var userIdentifier =
            httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";

        foreach (var cacheKey in request.CacheKeys)
        {
            var key = new StringBuilder(cacheKey);
            key.Append($"_user:{userIdentifier}");

            if (request.AppendRequestHeaders && httpContextAccessor.HttpContext is not null)
            {
                AppendCustomHeaders(key, httpContextAccessor.HttpContext.Request.Headers);
            }

            keysToInvalidate.Add(key.ToString());
        }

        return keysToInvalidate;
    }

    /// <summary>
    /// Appends custom headers to the key.
    /// </summary>
    /// <param name="key">The key.</param>
    /// <param name="headers">The headers.</param>
    private static void AppendCustomHeaders(StringBuilder key, IHeaderDictionary headers)
    {
        foreach (var header in headers)
        {
            if (IsKeyCustom(header.Key))
            {
                key.Append($"_{header.Key}:{header.Value}");
            }
        }
    }

    /// <summary>
    /// Determines whether the specified key is custom.
    /// </summary>
    /// <param name="key">The key.</param>
    /// <returns>
    ///   <see langword="true"/> if the specified key is custom; otherwise, <see langword="false"/>.
    /// </returns>
    private static bool IsKeyCustom(string? key)
    {
        return !string.IsNullOrEmpty(key)
            && (
                key.StartsWith(RequestHeaderConstValues.CustomPrefix, StringComparison.OrdinalIgnoreCase)
                || key.StartsWith(RequestHeaderConstValues.AcceptLanguage, StringComparison.OrdinalIgnoreCase)
            );
    }
}
