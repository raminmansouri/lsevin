using System.Reflection;
using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Data;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Persistence.Converters;
using BuildingBlocks.Core.Persistence.Interceptors;
using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Represents a set of extension methods for persistence.
/// </summary>
public static class PersistenceExtensions
{
    /// <summary>
    /// Adds the interceptor to the specified services collection.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddBaseInterceptor(this IServiceCollection services)
    {
        services.TryAddSingleton<AuditableEntityInterceptor>();

        return services;
    }

    /// <summary>
    /// Adds the base specifications to the specified services collection.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection AddBaseSpecifications(this IServiceCollection services)
    {
        services.TryAddScoped<ISpecificationEvaluator, SpecificationBaseEvaluator>();

        return services;
    }

    /// <summary>
    /// Registers the project repositories.
    /// </summary>
    /// <param name="services">The service collection to register the repositories with.</param>
    /// <param name="repositoryAssemblyMarker">The assembly that marks the repository assemblies.</param>
    public static IServiceCollection RegisterProjectRepositories(
        this IServiceCollection services,
        Assembly repositoryAssemblyMarker
    )
    {
        services.AddScoped(typeof(IRepository<,>), typeof(Repository<,>));

        return services.Scan(scan =>
            scan.FromAssemblies(repositoryAssemblyMarker)
                .AddClasses(classes => classes.AssignableTo(typeof(IRepository<,>)), publicOnly: false)
                .AsImplementedInterfaces()
                .WithScopedLifetime()
        );
    }

    /// <summary>
    /// Adds the identity services to the specified services collection.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="typedIdAssemblyMarkers">The assemblies to scan for typed identifier types.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    public static IServiceCollection RegisterTypedIdHandlers(
        this IServiceCollection services,
        params Assembly[] typedIdAssemblyMarkers
    )
    {
        SqlMapper.AddTypeHandler(new GenericArrayHandler<string>());

        foreach (var assemblyType in typedIdAssemblyMarkers)
        {
            var typedIdTypes = assemblyType
                .GetTypes()
                .Where(t => t.IsSubclassOf(typeof(TypedIdValueBase)) && !t.IsAbstract);

            foreach (var type in typedIdTypes)
            {
                var handlerType = typeof(TypedIdValueHandler<>).MakeGenericType(type);
                var handler = Activator.CreateInstance(handlerType);

                if (handler is SqlMapper.ITypeHandler typeHandler)
                {
                    SqlMapper.AddTypeHandler(type, typeHandler);
                }
            }
        }

        return services;
    }
}
