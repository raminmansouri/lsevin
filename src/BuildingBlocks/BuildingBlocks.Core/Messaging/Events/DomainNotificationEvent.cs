using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Generators;

namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the domain event notification.
/// </summary>
public abstract record DomainNotificationEvent<TDomainEvent> : IDomainNotificationEvent<TDomainEvent>
    where TDomainEvent : IDomainEvent
{
    /// <summary>
    /// Gets the domain event.
    /// </summary>
    public TDomainEvent DomainEvent { get; init; }

    /// <summary>
    /// Gets the unique identifier of the domain event.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Gets the date and time at which the domain event occurred.
    /// </summary>
    public DateTime OccurredOn { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="DomainNotificationEvent{TDomainEvent}"/> class.
    /// </summary>
    /// <param name="domainEvent">The domain event.</param>
    /// <param name="id">The unique identifier of the domain event.</param>
    /// <param name="occurredOn">The date and time at which the domain event occurred.</param>
    protected DomainNotificationEvent(TDomainEvent domainEvent, Guid? id, DateTime? occurredOn)
    {
        DomainEvent = domainEvent;
        Id = id ?? IdGenerator.NewId();
        OccurredOn = occurredOn ?? SystemClock.Now;
    }
}
