using System.Net.Http.Json;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Common.HttpClients.Dto;
using Microsoft.Extensions.Logging;
using Polly.Wrap;

namespace LSevin.Modules.Common.HttpClients;

internal sealed class WebApplicationCacheApiClient(
    HttpClient httpClient,
    AsyncPolicyWrap combinedPolicy,
    ILogger<WebApplicationCacheApiClient> logger
) : IWebApplicationCacheApiClient
{
    public async Task<Result<bool>> InvalidateCacheAsync(
        IEnumerable<string> tags,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var tagList = tags.ToList();
            logger.LogInformation(
                "[WebApplicationCache] - Invalidating cache for tags: {Tags}",
                string.Join(", ", tagList)
            );

            var request = new WebApplicationCacheRequestClientDto(tagList);
            var url = "webhooks/cache-invalidation";

            var response = await combinedPolicy.ExecuteAsync(() =>
                httpClient.PostAsJsonAsync(url, request, cancellationToken)
            );

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "[WebApplicationCache] - Failed to invalidate cache. Status code: {StatusCode}",
                    response.StatusCode
                );
                return false;
            }

            logger.LogInformation("[WebApplicationCache] - Cache invalidation successful");
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[WebApplicationCache] - Error invalidating cache: {ErrorMessage}", ex.Message);
            return false;
        }
    }
}
