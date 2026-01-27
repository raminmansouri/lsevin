namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the domain notification event.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="IDomainNotificationEvent"/> class.
/// </remarks>
/// <typeparam name="TDomainEventType">The type of the domain event type.</typeparam>
public interface IDomainNotificationEvent<out TDomainEventType> : IDomainNotificationEvent
    where TDomainEventType : IDomainEvent
{
    /// <summary>
    /// Gets the domain event.
    /// </summary>
    TDomainEventType DomainEvent { get; }
}

/// <summary>
/// Represents the domain notification event.
/// </summary>
public interface IDomainNotificationEvent : IEvent;
