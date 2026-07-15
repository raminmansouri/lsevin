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
    /// Environment variable that supplies the WhatsiPlus API key at runtime. The key is a
    /// secret and MUST NOT live in appsettings; it is read from here and overrides any
    /// configured value when present.
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

        // The API key is a secret and is kept out of appsettings. Read it from the
        // WHATSIPLUS_API_KEY environment variable and override the bound value when set.
        // PostConfigure runs after the options binding, so this always wins.
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
