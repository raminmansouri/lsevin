using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Core.Serialization;

/// <summary>
/// Represents the serialization extensions.
/// </summary>
public static class SerializationExtensions
{
    /// <summary>
    /// Adds the message serialization.
    /// </summary>
    /// <param name="services">The services.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddDefaultSerialization(this IServiceCollection services)
    {
        services.TryAddSingleton<ISerializer, DefaultSerializer>();

        return services;
    }
}
