using BuildingBlocks.Core.Resiliency.Extensions;
using Microsoft.Extensions.DependencyInjection;

namespace LSevin.Modules.Common.HttpClients;

public static class HttpClientExtensions
{
    private const string WebhookKeyHeaderName = "X-WEBHOOK-KEY";

    public static IServiceCollection AddWebApplicationCacheApiClient(this IServiceCollection services)
    {
        services.AddCustomHttpClient<
            IWebApplicationCacheApiClient,
            WebApplicationCacheApiClient,
            WebApplicationClientOptions
        >(
            optionsKey: $"{nameof(WebApplicationClientOptions)}",
            configureClient: (_, httpClient, httpClientOptions) =>
                httpClient.DefaultRequestHeaders.Add(WebhookKeyHeaderName, httpClientOptions.ApiKey)
        );

        return services;
    }
}
