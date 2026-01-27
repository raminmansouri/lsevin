using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace BuildingBlocks.Web.Modules.Extensions;

/// <summary>
/// Extension methods for configuring and managing modules in the application.
/// </summary>
public static class ModuleServiceCollectionExtensions
{
    /// <summary>
    /// Creates a new service collection with the same services as the current one.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The new service collection.</returns>
    public static IServiceCollection CreatNewServiceCollection(this IServiceCollection services)
    {
        ServiceCollection newServiceCollection = [.. services];

        return newServiceCollection;
    }

    /// <summary>
    /// Adds the gateway processor to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddGatewayProcessor(this IServiceCollection services)
    {
        services.Replace(ServiceDescriptor.Singleton(typeof(IGatewayProcessor<>), typeof(GatewayProcessor<>)));

        return services;
    }

    /// <summary>
    /// Adds the controllers as services to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="scanAssemblies">Optional assemblies to scan for controllers.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddControllersAsServices(
        this IServiceCollection services,
        params Assembly[] scanAssemblies
    )
    {
        var assemblies = scanAssemblies.Length != 0 ? scanAssemblies : [Assembly.GetCallingAssembly()];

        return services.Scan(s =>
            s.FromAssemblies(assemblies)
                .AddClasses(f => f.AssignableTo<ControllerBase>())
                .AsSelf()
                .WithTransientLifetime()
        );
    }
}
