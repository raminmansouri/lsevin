using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Generators;

namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the interface for an event that is raised within the domain.
/// </summary>
public abstract record DomainEvent : IDomainEvent
{
    /// <summary>
    /// Gets the unique identifier of the domain event.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Gets the date and time at which the domain event occurred.
    /// </summary>
    public DateTime OccurredOn { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="DomainEvent"/> class.
    /// </summary>
    protected DomainEvent()
    {
        Id = IdGenerator.NewId();
        OccurredOn = SystemClock.Now;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="DomainEvent"/> class.
    /// </summary>
    /// <param name="id">The unique identifier of the domain event.</param>
    /// <param name="occurredOn">The date and time at which the domain event occurred.</param>
    protected DomainEvent(Guid id, DateTime occurredOn)
    {
        Id = id;
        OccurredOn = occurredOn;
    }
}
