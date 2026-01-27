using BuildingBlocks.Core.Types;

namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the domain notification registry.
/// </summary>
internal sealed class DomainNotificationRegistry : IDomainNotificationRegistry
{
    // Dictionary to store mappings from domain event types to notification types
    private readonly Dictionary<Type, Type> _eventToNotificationMap = new();

    /// <inheritdoc />
    public Type? GetNotificationTypeFor(Type domainEventType)
    {
        // First check our explicit mappings
        if (_eventToNotificationMap.TryGetValue(domainEventType, out var notificationType))
        {
            return notificationType;
        }

        // For generic types, check if we have a mapping for the generic type definition
        if (domainEventType.IsGenericType)
        {
            var openGenericType = domainEventType.GetGenericTypeDefinition();

            if (_eventToNotificationMap.TryGetValue(openGenericType, out var openGenericNotificationType))
            {
                // Create a closed generic type with the same type arguments
                return openGenericNotificationType.MakeGenericType(domainEventType.GetGenericArguments());
            }
        }

        // Fall back to naming convention as a last resort
        var notificationTypeName =
            $"{domainEventType.Name.Replace("DomainEvent", string.Empty, StringComparison.Ordinal)}Notification";

        try
        {
            return TypeMapper.GetType(notificationTypeName);
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }

    /// <inheritdoc />
    public void Register<TDomainEvent, TNotification>()
        where TDomainEvent : IDomainEvent
        where TNotification : IDomainNotificationEvent<TDomainEvent>
    {
        // Register with TypeMapper
        TypeMapper.AddType<TDomainEvent>(TypeMapper.GetTypeName<TDomainEvent>());
        TypeMapper.AddType<TNotification>(TypeMapper.GetTypeName<TNotification>());

        // Store in our mapping dictionary
        _eventToNotificationMap[typeof(TDomainEvent)] = typeof(TNotification);
    }
}
