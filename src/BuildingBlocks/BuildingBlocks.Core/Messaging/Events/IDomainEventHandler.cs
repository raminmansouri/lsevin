namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the domain event handler.
/// </summary>
/// <typeparam name="TEvent">The type of the domain event.</typeparam>
public interface IDomainEventHandler<in TEvent> : IEventHandler<TEvent>
    where TEvent : IDomainEvent;
