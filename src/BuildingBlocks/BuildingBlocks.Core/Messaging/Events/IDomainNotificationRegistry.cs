namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the domain notification registry.
/// </summary>
public interface IDomainNotificationRegistry
{
    /// <summary>
    /// Gets the notification type for the specified domain event type.
    /// </summary>
    /// <param name="domainEventType">The domain event type.</param>
    /// <returns>The notification type.</returns>
    Type? GetNotificationTypeFor(Type domainEventType);

    /// <summary>
    /// Registers the specified domain event and notification types.
    /// </summary>
    /// <typeparam name="TDomainEvent">The type of the domain event.</typeparam>
    /// <typeparam name="TNotification">The type of the notification.</typeparam>
    void Register<TDomainEvent, TNotification>()
        where TDomainEvent : IDomainEvent
        where TNotification : IDomainNotificationEvent<TDomainEvent>;
}
