using System.Reflection;
using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.Persistence.EventSourcing.Checkpoints;
using BuildingBlocks.Core.Persistence.EventSourcing.EventStore;
using BuildingBlocks.Core.Persistence.EventSourcing.Projections;
using BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;
using BuildingBlocks.Persistence.EventStoreDB.Repository;
using BuildingBlocks.Persistence.EventStoreDB.Subscriptions;
using EventStore.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Persistence.EventStoreDB;

/// <summary>
/// Represents the event store DB options.
/// </summary>
public static class EventStoreConfigExtensions
{
    /// <summary>
    /// The default config key.
    /// </summary>
    public static IServiceCollection AddEventStoreDb(
        this IServiceCollection services,
        IConfiguration config,
        EventStoreOptions? options = null
    )
    {
        var connectionString = config.GetConnectionStringOrThrow("eventstore");

        services.TryAddSingleton(new EventStoreClient(EventStoreClientSettings.Create(connectionString)));

        services.AddSingleton(typeof(IEventStore<,>), typeof(EventStoreRepository<,>));
        services.TryDecorate(typeof(IEventStore<,>), typeof(OutboxEventStoreDecorator<,>));

        if (options?.UseInternalCheckpointing != false)
        {
            services.AddTransient<ISubscriptionCheckpointRepository, EventStoreSubscriptionCheckpointRepository>();
        }

        return services;
    }

    /// <summary>
    /// Adds the event store DB subscription to all.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="checkpointToEventStore">if set to <c>true</c> [checkpoint to event store DB].</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddEventStoreSubscriptionToAll(
        this IServiceCollection services,
        bool checkpointToEventStore = true
    )
    {
        if (checkpointToEventStore)
        {
            services.AddTransient<ISubscriptionCheckpointRepository, EventStoreSubscriptionCheckpointRepository>();
        }

        services.AddHostedService<EventStoreSubscriptionToAll>();
        return services;
    }

    /// <summary>
    /// Adds the projections.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="assembliesToScan">The assemblies to scan.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddProjections(
        this IServiceCollection services,
        params Assembly[] assembliesToScan
    )
    {
        services.TryAddSingleton<IProjectionPublisher, ProjectionPublisher>();

        RegisterProjections(services, assembliesToScan);

        return services;
    }

    /// <summary>
    /// Adds the event store.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="assemblies">The assemblies.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddEventStore(
        this IServiceCollection services,
        IConfiguration configuration,
        params Assembly[] assemblies
    )
    {
        var assembliesToScan = assemblies.Length > 0 ? assemblies : [Assembly.GetEntryAssembly()!];

        return services
            .AddEventStoreDb(configuration)
            .AddProjections(assembliesToScan)
            .AddEventStoreSubscriptionToAll();
    }

    /// <summary>
    /// Registers the projections.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="assembliesToScan">The assemblies to scan.</param>
    private static void RegisterProjections(IServiceCollection services, Assembly[] assembliesToScan)
    {
        services.Scan(scan =>
            scan.FromAssemblies(assembliesToScan)
                .AddClasses(classes => classes.AssignableTo<IProjection>(), publicOnly: false)
                .AsImplementedInterfaces()
                .WithTransientLifetime()
        );
    }
}
