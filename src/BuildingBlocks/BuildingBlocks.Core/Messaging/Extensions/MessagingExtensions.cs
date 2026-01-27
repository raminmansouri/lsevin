using System.Reflection;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;
using BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand;
using BuildingBlocks.Core.Types;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Core.Messaging.Extensions;

/// <summary>
/// Provides extension methods for messaging.
/// </summary>
public static class MessagingExtensions
{
    /// <summary>
    /// Adds the message bus to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    /// <param name="assemblies">The assemblies to scan for notifications.</param>
    public static IServiceCollection AddMessaging(this IServiceCollection services, params Assembly[] assemblies)
    {
        services
            .AddTransient<ICommandScheduler, CommandScheduler>()
            .AddTransient<ICommandBus, CommandBus>()
            .AddTransient<IQueryBus, QueryBus>()
            .AddTransient<IEventPublisher, EventPublisher>()
            .AddDomainNotifications(assemblies)
            .RegisterEventMappers(assemblies)
            .RegisterEventRegistries(assemblies);

        return services;
    }

    /// <summary>
    /// Subscribes all message from assembly of the specified type.
    /// </summary>
    /// <param name="app">The application builder.</param>
    /// <param name="eventTypes">The event types.</param>
    /// <returns>The configured application builder.</returns>
    public static IApplicationBuilder SubscribeAllMessageFromAssemblyOfType(
        this IApplicationBuilder app,
        params Type[] eventTypes
    )
    {
        // We retrieve IEventBus (or InMemoryEventBusClient) from DI.
        var eventBus = app.ApplicationServices.GetRequiredService<IEventBus>();

        foreach (var eventType in eventTypes)
        {
            var consumerType = typeof(IntegrationEventConsumer<>).MakeGenericType(eventType);

            var consumerInstance = ActivatorUtilities.CreateInstance(app.ApplicationServices, consumerType);

            var subscribeMethod = typeof(IEventBus)
                .GetMethods()
                .First(m =>
                    string.Equals(m.Name, nameof(IEventBus.Subscribe), StringComparison.Ordinal)
                    && m.GetGenericArguments().Length == 1
                    && m.GetParameters().Length == 1
                );

            var genericSubscribeMethod = subscribeMethod.MakeGenericMethod(eventType);

            genericSubscribeMethod.Invoke(eventBus, [consumerInstance]);
        }

        return app;
    }

    /// <summary>
    /// Registers domain events and their corresponding notifications with the notification registry.
    /// </summary>
    /// <param name="app">The application builder.</param>
    /// <returns>The application builder for chaining.</returns>
    public static IApplicationBuilder RegisterDomainEventNotifications(this IApplicationBuilder app)
    {
        var notificationRegistry = app.ApplicationServices.GetRequiredService<IEventRegistry>();

        notificationRegistry.RegisterEvents();

        return app;
    }

    /// <summary>
    /// Adds the event bus.
    /// </summary>
    /// <param name="services">The services.</param>
    /// <returns>The service collection.</returns>
    public static IServiceCollection AddEventBus(this IServiceCollection services)
    {
        services.TryAddSingleton<IEventBus, InMemoryEventBusClient>();

        return services;
    }

    /// <summary>
    /// Registers the event mappers.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="assembliesToScan">The assemblies to scan.</param>
    private static IServiceCollection RegisterEventMappers(
        this IServiceCollection services,
        params Assembly[] assembliesToScan
    )
    {
        return services.Scan(scan =>
            scan.FromAssemblies(
                    assembliesToScan.Length != 0 ? assembliesToScan : AppDomain.CurrentDomain.GetAssemblies()
                )
                .AddClasses(classes => classes.AssignableTo<IEventMapper>(), publicOnly: false)
                .AsImplementedInterfaces()
                .WithSingletonLifetime()
        );
    }

    /// <summary>
    /// Registers the event registries.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="assembliesToScan">The assemblies to scan.</param>
    private static IServiceCollection RegisterEventRegistries(
        this IServiceCollection services,
        params Assembly[] assembliesToScan
    )
    {
        return services.Scan(scan =>
            scan.FromAssemblies(
                    assembliesToScan.Length != 0 ? assembliesToScan : AppDomain.CurrentDomain.GetAssemblies()
                )
                .AddClasses(classes => classes.AssignableTo<IEventRegistry>(), publicOnly: false)
                .AsImplementedInterfaces()
                .WithSingletonLifetime()
        );
    }

    /// <summary>
    /// Adds the domain notifications.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="assemblies">The assemblies to scan for notifications.</param>
    /// <returns>The same service collection so that multiple calls can be chained.</returns>
    private static IServiceCollection AddDomainNotifications(
        this IServiceCollection services,
        params Assembly[] assemblies
    )
    {
        // If no assemblies provided, use the calling assembly
        if (assemblies.Length == 0)
        {
            assemblies = [Assembly.GetCallingAssembly()];
        }

        // Find all notification types
        var notificationTypes = assemblies
            .SelectMany(assembly => assembly.GetExportedTypes())
            .Where(type =>
                type is { IsAbstract: false, IsInterface: false, IsClass: true } && IsNotificationType(type)
            );

        foreach (var notificationType in notificationTypes)
        {
            var domainEventType = GetDomainEventTypeFromNotification(notificationType);

            if (domainEventType != null)
            {
                // Register in TypeMapper
                TypeMapper.AddType(domainEventType, TypeMapper.GetTypeName(domainEventType));
                TypeMapper.AddType(notificationType, TypeMapper.GetTypeName(notificationType));
            }
        }

        services.AddSingleton<IDomainNotificationRegistry, DomainNotificationRegistry>();

        return services;
    }

    /// <summary>
    /// Gets the domain event type from the notification type.
    /// </summary>
    /// <param name="type">The notification type.</param>
    /// <returns>The domain event type.</returns>
    private static bool IsNotificationType(Type type)
    {
        return type.BaseType?.IsGenericType == true
            && type.BaseType.GetGenericTypeDefinition() == typeof(DomainNotificationEventWrapper<>);
    }

    /// <summary>
    /// Determines whether the specified type is a notification type.
    /// </summary>
    /// <param name="notificationType">The notification type.</param>
    /// <returns>True if the type is a notification type; otherwise, false.</returns>
    private static Type? GetDomainEventTypeFromNotification(Type notificationType)
    {
        return notificationType.BaseType?.GetGenericArguments().FirstOrDefault();
        // return typeof(DomainNotificationEventWrapper<>)
        //     .MakeGenericType(notificationType);
    }
}
