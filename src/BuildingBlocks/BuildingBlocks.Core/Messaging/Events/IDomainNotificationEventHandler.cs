namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the domain notification event handler.
/// </summary>
/// <typeparam name="TEvent">The type of the domain notification event.</typeparam>
public interface IDomainNotificationEventHandler<in TEvent> : IEventHandler<TEvent>
    where TEvent : IDomainNotificationEvent;
