using System.Collections.Concurrent;
using System.Reflection;
using BuildingBlocks.Core.Messaging.EventBus;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;

/// <summary>
/// Represents the integration event handlers factory. It caches the handlers for each type.
/// </summary>
public static class IntegrationEventHandlersFactory
{
    private static readonly ConcurrentDictionary<string, Type[]> _handlersDictionary = new(StringComparer.Ordinal);

    /// <summary>
    /// Gets the handlers for the specified type.
    /// </summary>
    /// <param name="type">The type.</param>
    /// <param name="serviceProvider">The service provider.</param>
    /// <param name="assembly">The assembly.</param>
    /// <returns>The handlers.</returns>
    public static IReadOnlyList<IIntegrationEventHandler> GetHandlers(
        Type type,
        IServiceProvider serviceProvider,
        Assembly assembly
    )
    {
        var integrationEventHandlerTypes = _handlersDictionary.GetOrAdd(
            $"{assembly.GetName().Name}-{type.Name}",
            _ =>
            {
                var integrationEventHandlers = assembly
                    .GetTypes()
                    .Where(t => t.IsAssignableTo(typeof(IIntegrationEventHandler<>)))
                    .ToArray();

                return integrationEventHandlers;
            }
        );

        List<IIntegrationEventHandler> handlers = [];
        handlers.AddRange(
            integrationEventHandlerTypes
                .Select(serviceProvider.GetRequiredService)
                .Select(integrationEventHandler => (integrationEventHandler as IIntegrationEventHandler)!)
        );

        return handlers;
    }
}
