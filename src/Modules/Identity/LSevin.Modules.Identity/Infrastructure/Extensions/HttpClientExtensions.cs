using System;
using BuildingBlocks.Core.Resiliency.Extensions;
using LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak;
using LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace LSevin.Modules.Identity.Infrastructure.Extensions;

public static class HttpClientExtensions
{
    private const string ModuleName = "Identity";

    /// <summary>
    /// Optional environment variable that supplies the WhatsiPlus API key. When set to a
    /// non-empty value it overrides <c>Identity:WhatsplusClientOptions:ApiKey</c> from
    /// appsettings; when unset/empty the appsettings value is used as-is.
    /// </summary>
    private const string WhatsiplusApiKeyEnvVar = "WHATSIPLUS_API_KEY";

    public static IServiceCollection AddHttpClients(this IServiceCollection services)
    {
        services.AddMeliPayamakApiClient().AddWhatsplusApiClient();

        return services;
    }

    private static IServiceCollection AddMeliPayamakApiClient(this IServiceCollection services)
    {
        services.AddCustomHttpClient<IMeliPayamakApiClient, MeliPayamakApiClient, MeliPayamakClientOptions>(
            optionsKey: $"{ModuleName}:{nameof(MeliPayamakClientOptions)}",
            configureClient: null // No special headers needed (username/password in body)
        );

        return services;
    }

    private static IServiceCollection AddWhatsplusApiClient(this IServiceCollection services)
    {
        services.AddCustomHttpClient<IWhatsplusApiClient, WhatsplusApiClient, WhatsplusClientOptions>(
            optionsKey: $"{ModuleName}:{nameof(WhatsplusClientOptions)}",
            configureClient: null
        );

        // The key comes from appsettings (Identity:WhatsplusClientOptions:ApiKey). If the
        // WHATSIPLUS_API_KEY environment variable is set to a non-empty value it wins:
        // PostConfigure runs after the options binding. An empty/unset var changes nothing.
        services.PostConfigure<WhatsplusClientOptions>(o =>
        {
            var key = Environment.GetEnvironmentVariable(WhatsiplusApiKeyEnvVar);
            if (!string.IsNullOrWhiteSpace(key))
            {
                o.ApiKey = key;
            }
        });

        return services;
    }
}
