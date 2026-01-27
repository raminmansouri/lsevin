using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace BuildingBlocks.Web.Extensions.ServiceCollection;

/// <summary>
/// Extension methods for <see cref="IServiceCollection"/>.
/// </summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>
    /// Replaces the registration of the specified service type with a scoped implementation type.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <typeparam name="TImplementation">The type of the implementation.</typeparam>
    /// <param name="services">The service collection.</param>
    public static void ReplaceScoped<TService, TImplementation>(this IServiceCollection services)
        where TService : class
        where TImplementation : class, TService
    {
        services.Unregister<TService>();
        services.AddScoped<TService, TImplementation>();
    }

    /// <summary>
    /// Replaces the registration of the specified service type with a scoped implementation factory.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="implementationFactory">The implementation factory.</param>
    public static void ReplaceScoped<TService>(
        this IServiceCollection services,
        Func<IServiceProvider, TService> implementationFactory
    )
        where TService : class
    {
        services.Unregister<TService>();
        services.AddScoped(implementationFactory);
    }

    /// <summary>
    /// Replaces the registration of the specified service type with a transient implementation type.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <typeparam name="TImplementation">The type of the implementation.</typeparam>
    /// <param name="services">The service collection.</param>
    public static void ReplaceTransient<TService, TImplementation>(this IServiceCollection services)
        where TService : class
        where TImplementation : class, TService
    {
        services.Unregister<TService>();
        services.AddTransient<TService, TImplementation>();
    }

    /// <summary>
    /// Replaces the registration of the specified service type with a transient implementation factory.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="implementationFactory">The implementation factory.</param>
    public static void ReplaceTransient<TService>(
        this IServiceCollection services,
        Func<IServiceProvider, TService> implementationFactory
    )
        where TService : class
    {
        services.Unregister<TService>();
        services.AddTransient(implementationFactory);
    }

    /// <summary>
    /// Replaces the registration of the specified service type with a singleton implementation type.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <typeparam name="TImplementation">The type of the implementation.</typeparam>
    /// <param name="services">The service collection.</param>
    public static void ReplaceSingleton<TService, TImplementation>(this IServiceCollection services)
        where TService : class
        where TImplementation : class, TService
    {
        services.Unregister<TService>();
        services.AddSingleton<TService, TImplementation>();
    }

    /// <summary>
    /// Replaces the registration of the specified service type with a singleton implementation factory.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="implementationFactory">The implementation factory.</param>
    public static void ReplaceSingleton<TService>(
        this IServiceCollection services,
        Func<IServiceProvider, TService> implementationFactory
    )
        where TService : class
    {
        services.Unregister<TService>();
        services.AddSingleton(implementationFactory);
    }

    /// <summary>
    /// Unregisters the specified service type from the service collection.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <param name="services">The service collection.</param>
    public static void Unregister<TService>(this IServiceCollection services)
    {
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(TService));
        if (descriptor is null)
        {
            return;
        }

        services.Remove(descriptor);
    }

    /// <summary>
    /// Adds a new transient registration to the service collection only when no existing registration.
    /// of the same service type and implementation type exists.
    /// In contrast to TryAddTransient, which only checks the service type.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceType">The type of the service.</param>
    /// <param name="implementationType">The type of the implementation.</param>
    public static void TryAddTransientExact(this IServiceCollection services, Type serviceType, Type implementationType)
    {
        if (services.Any(reg => reg.ServiceType == serviceType && reg.ImplementationType == implementationType))
        {
            return;
        }

        services.AddTransient(serviceType, implementationType);
    }

    /// <summary>
    /// Adds a new scope registration to the service collection only when no existing registration.
    /// of the same service type and implementation type exists.
    /// In contrast to TryAddScope, which only checks the service type.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceType">The type of the service.</param>
    /// <param name="implementationType">The type of the implementation.</param>
    public static void TryAddScopeExact(this IServiceCollection services, Type serviceType, Type implementationType)
    {
        if (services.Any(reg => reg.ServiceType == serviceType && reg.ImplementationType == implementationType))
        {
            return;
        }

        services.AddScoped(serviceType, implementationType);
    }

    /// <summary>
    /// Adds a new registration to the service collection with a specified implementation factory and service lifetime.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <typeparam name="TImplementation">The type of the implementation.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="implementationFactory">The implementation factory.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection Add<TService, TImplementation>(
        this IServiceCollection services,
        Func<IServiceProvider, TImplementation> implementationFactory,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
        where TService : class
        where TImplementation : class, TService
    {
        return serviceLifetime switch
        {
            ServiceLifetime.Singleton => services.AddSingleton<TService, TImplementation>(implementationFactory),
            ServiceLifetime.Scoped => services.AddScoped<TService, TImplementation>(implementationFactory),
            ServiceLifetime.Transient => services.AddTransient<TService, TImplementation>(implementationFactory),
            _ => throw new ArgumentNullException(nameof(serviceLifetime)),
        };
    }

    /// <summary>
    /// Adds a new registration to the service collection with a specified implementation factory and service lifetime.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="implementationFactory">The implementation factory.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection Add<TService>(
        this IServiceCollection services,
        Func<IServiceProvider, TService> implementationFactory,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
        where TService : class
    {
        return serviceLifetime switch
        {
            ServiceLifetime.Singleton => services.AddSingleton(implementationFactory),
            ServiceLifetime.Scoped => services.AddScoped(implementationFactory),
            ServiceLifetime.Transient => services.AddTransient(implementationFactory),
            _ => throw new ArgumentNullException(nameof(serviceLifetime)),
        };
    }

    /// <summary>
    /// Adds a new registration to the service collection with a specified service lifetime.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection Add<TService>(
        this IServiceCollection services,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
        where TService : class
    {
        return serviceLifetime switch
        {
            ServiceLifetime.Singleton => services.AddSingleton<TService>(),
            ServiceLifetime.Scoped => services.AddScoped<TService>(),
            ServiceLifetime.Transient => services.AddTransient<TService>(),
            _ => throw new ArgumentNullException(nameof(serviceLifetime)),
        };
    }

    /// <summary>
    /// Adds a new registration to the service collection with a specified service type and service lifetime.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceType">The type of the service.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection Add(
        this IServiceCollection services,
        Type serviceType,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
    {
        return serviceLifetime switch
        {
            ServiceLifetime.Singleton => services.AddSingleton(serviceType),
            ServiceLifetime.Scoped => services.AddScoped(serviceType),
            ServiceLifetime.Transient => services.AddTransient(serviceType),
            _ => throw new ArgumentNullException(nameof(serviceLifetime)),
        };
    }

    /// <summary>
    /// Adds a new registration to the service collection with a specified service type, implementation type, and service lifetime.
    /// </summary>
    /// <typeparam name="TService">The type of the service.</typeparam>
    /// <typeparam name="TImplementation">The type of the implementation.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection Add<TService, TImplementation>(
        this IServiceCollection services,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
        where TService : class
        where TImplementation : class, TService
    {
        return serviceLifetime switch
        {
            ServiceLifetime.Singleton => services.AddSingleton<TService, TImplementation>(),
            ServiceLifetime.Scoped => services.AddScoped<TService, TImplementation>(),
            ServiceLifetime.Transient => services.AddTransient<TService, TImplementation>(),
            _ => throw new ArgumentNullException(nameof(serviceLifetime)),
        };
    }

    /// <summary>
    /// Adds a new registration to the service collection with a specified service type, implementation factory, and service lifetime.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceType">The type of the service.</param>
    /// <param name="implementationFactory">The implementation factory.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection Add(
        this IServiceCollection services,
        Type serviceType,
        Func<IServiceProvider, object> implementationFactory,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
    {
        return serviceLifetime switch
        {
            ServiceLifetime.Singleton => services.AddSingleton(serviceType, implementationFactory),
            ServiceLifetime.Scoped => services.AddScoped(serviceType, implementationFactory),
            ServiceLifetime.Transient => services.AddTransient(serviceType, implementationFactory),
            _ => throw new ArgumentNullException(nameof(serviceLifetime)),
        };
    }

    /// <summary>
    /// Adds a new registration to the service collection with a specified service type, implementation type, and service lifetime.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceType">The type of the service.</param>
    /// <param name="implementationType">The type of the implementation.</param>
    /// <param name="serviceLifetime">The service lifetime.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection Add(
        this IServiceCollection services,
        Type serviceType,
        Type implementationType,
        ServiceLifetime serviceLifetime = ServiceLifetime.Transient
    )
    {
        return serviceLifetime switch
        {
            ServiceLifetime.Singleton => services.AddSingleton(serviceType, implementationType),
            ServiceLifetime.Scoped => services.AddScoped(serviceType, implementationType),
            ServiceLifetime.Transient => services.AddTransient(serviceType, implementationType),
            _ => throw new ArgumentNullException(nameof(serviceLifetime)),
        };
    }

    /// <summary>
    /// Validate container dependencies.
    /// </summary>
    /// <param name="rootServiceProvider"></param>
    /// <param name="services"></param>
    /// <param name="assembliesToScan"></param>
    public static void ValidateDependencies(
        this IServiceProvider rootServiceProvider,
        IServiceCollection services,
        params Assembly[] assembliesToScan
    )
    {
        var scanAssemblies = assembliesToScan.Length != 0 ? assembliesToScan : [Assembly.GetExecutingAssembly()];

        using var scope = rootServiceProvider.CreateScope();
        var sp = scope.ServiceProvider;

        foreach (var serviceDescriptor in services)
        {
            if (
                serviceDescriptor.ServiceType == typeof(IHostedService)
                || serviceDescriptor.ServiceType == typeof(IHostApplicationLifetime)
            )
            {
                continue;
            }

            try
            {
                var serviceType = serviceDescriptor.ServiceType;
                if (scanAssemblies.Contains(serviceType.Assembly))
                {
                    var service = sp.GetService(serviceType);

                    if (
                        serviceDescriptor.ImplementationInstance == null
                        && serviceDescriptor.ImplementationFactory == null
                    )
                    {
                        ArgumentNullException.ThrowIfNull(
                            service,
                            $"Service {serviceType.FullName} is not registered."
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Failed to resolve service {serviceDescriptor.ServiceType.FullName}: {ex.Message}",
                    ex
                );
            }
        }
    }
}
