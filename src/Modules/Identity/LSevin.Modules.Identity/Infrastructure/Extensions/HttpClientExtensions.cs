using BuildingBlocks.Core.Resiliency.Extensions;
using LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak;
using LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus;
using Microsoft.Extensions.DependencyInjection;

namespace LSevin.Modules.Identity.Infrastructure.Extensions;

public static class HttpClientExtensions
{
    private const string ModuleName = "Identity";

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

        return services;
    }
}
