using System.Reflection;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Persistence.MessagePersistence.Inbox.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.Outbox.Idempotency;
using BuildingBlocks.Core.Reflection;
using BuildingBlocks.Core.ResultPattern;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;

/// <summary>
/// Provides extension methods for registering idempotent handlers.
/// </summary>
public static class IdempotencyExtensions
{
    /// <summary>
    /// Adds idempotent notification handlers for domain events.
    /// </summary>
    /// <param name="services">The service collection to add the handlers to.</param>
    /// <param name="assemblyMarker">The assembly marker to scan for handlers.</param>
    /// <returns>The service collection with the handlers added.</returns>
    public static IServiceCollection AddIdempotentDomainNotificationHandlers(
        this IServiceCollection services,
        Assembly assemblyMarker
    )
    {
        // Find all concrete notification handler types that handle a domain notification event.
        var notificationHandlerTypes = assemblyMarker
            .GetTypes()
            .Where(t =>
                t is { IsAbstract: false, IsInterface: false }
                && t.GetInterfaces()
                    .Any(i =>
                        i.IsGenericType
                        && i.GetGenericTypeDefinition() == typeof(INotificationHandler<>)
                        && i.GetGenericArguments()[0].IsAssignableTo(typeof(IDomainNotificationEvent))
                    )
            )
            .ToArray();

        // Register each concrete handler (if not already registered).
        foreach (var handlerType in notificationHandlerTypes)
        {
            services.TryAddScoped(handlerType);
        }

        // Group the notification handlers by their notification type.
        var notificationTypes = notificationHandlerTypes
            .Select(t =>
                t.GetInterfaces()
                    .First(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(INotificationHandler<>))
                    .GetGenericArguments()[0]
            )
            .Distinct();

        // For each distinct notification type, apply the idempotency decorator once.
        foreach (var notificationType in notificationTypes)
        {
            var idempotentHandlerType = typeof(IdempotentNotificationHandler<>).MakeGenericType(notificationType);
            services.Decorate(typeof(INotificationHandler<>).MakeGenericType(notificationType), idempotentHandlerType);
        }

        return services;
    }

    /// <summary>
    /// Adds idempotent handlers for integration events.
    /// </summary>
    /// <param name="services">The service collection to add the handlers to.</param>
    /// <param name="assemblyMarker">The assembly marker to scan for handlers.</param>
    /// <returns>The service collection with the handlers added.</returns>
    public static IServiceCollection AddIdempotentIntegrationEventHandlers(
        this IServiceCollection services,
        Assembly assemblyMarker
    )
    {
        // Get all integration event handler types
        var integrationEventHandlerTypes = assemblyMarker.GetTypesByInterface<IIntegrationEventHandler>();

        // Register each concrete handler
        foreach (var handlerType in integrationEventHandlerTypes)
        {
            // First register the concrete handler by its concrete type
            services.TryAddScoped(handlerType);

            // Get the integration event type this handler is for
            var integrationEventType = handlerType.GetGenericArgument();

            // Create the closed generic interface for this handler
            var handlerInterface = typeof(IIntegrationEventHandler<>).MakeGenericType(integrationEventType);

            // Explicitly register the handler with its interface
            services.AddScoped(handlerInterface, handlerType);

            // Create the idempotent handler type for this event
            var closedIdempotentHandler = typeof(IdempotentIntegrationEventHandler<>).MakeGenericType(
                integrationEventType
            );

            // Decorate the interface registration
            services.Decorate(handlerInterface, closedIdempotentHandler);
        }

        return services;
    }

    /// <summary>
    /// Adds idempotent handlers for internal commands.
    /// </summary>
    /// <param name="services">The service collection to add the handlers to.</param>
    /// <param name="assemblyMarker">The assembly marker to scan for handlers.</param>
    /// <returns>The service collection with the handlers added.</returns>
    public static IServiceCollection AddIdempotentInternalCommandHandlers(
        this IServiceCollection services,
        Assembly assemblyMarker
    )
    {
        var internalCommandHandlerTypes = assemblyMarker
            .GetTypes()
            .Where(t =>
                t is { IsAbstract: false, IsInterface: false }
                && t.GetInterfaces()
                    .Any(i =>
                        i.IsGenericType
                        && i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>)
                        && i.GetGenericArguments()[0].IsAssignableTo(typeof(IInternalCommand))
                    )
            )
            .ToArray();

        foreach (var handlerType in internalCommandHandlerTypes)
        {
            services.TryAddScoped(handlerType);

            // Get the command type from the handler
            var handlerInterface = handlerType
                .GetInterfaces()
                .First(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>));

            var commandType = handlerInterface.GetGenericArguments()[0];

            // Create and register the idempotent handler
            var handlerInterfaceType = typeof(IRequestHandler<,>).MakeGenericType(commandType, typeof(Result<bool>));

            var idempotentHandlerType = typeof(IdempotencyInternalCommandHandler<>).MakeGenericType(commandType);

            services.Decorate(handlerInterfaceType, idempotentHandlerType);
        }

        return services;
    }
}
