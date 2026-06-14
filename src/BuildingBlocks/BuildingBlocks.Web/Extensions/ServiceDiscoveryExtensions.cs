using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Extensions;

/// <summary>
/// Extension methods for configuring and adding pre-configured presentation-related services.
/// </summary>
public static class ServiceDiscoveryExtensions
{
    /// <summary>
    /// Adds pre-configured presentation-related services to the DI container.
    /// </summary>
    /// <param name="services">See the <see cref="IServiceCollection"/> interface.</param>
    /// <returns>The modified service collection.</returns>
    public static IServiceCollection AddServiceDiscoveryDefaults(this IServiceCollection services)
    {
        services.AddServiceDiscovery();

        services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();

            http.AddServiceDiscovery();
        });

        return services;
    }
}
