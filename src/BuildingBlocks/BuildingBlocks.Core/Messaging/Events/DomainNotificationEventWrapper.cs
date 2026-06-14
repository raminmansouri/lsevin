namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the domain notification event wrapper.
/// </summary>
/// <typeparam name="TDomainEventType">The type of the domain event type.</typeparam>
public abstract record DomainNotificationEventWrapper<TDomainEventType> : DomainNotificationEvent<TDomainEventType>
    where TDomainEventType : IDomainEvent
{
    /// <summary>
    /// Initializes a new instance of the <see cref="DomainNotificationEventWrapper{TDomainEventType}"/> class.
    /// </summary>
    /// <param name="domainEvent">The domain event.</param>
    protected DomainNotificationEventWrapper(TDomainEventType domainEvent)
        : base(domainEvent, domainEvent.Id, domainEvent.OccurredOn) { }
}
