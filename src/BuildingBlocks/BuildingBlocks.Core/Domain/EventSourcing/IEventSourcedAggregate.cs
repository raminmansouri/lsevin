using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Domain.EventSourcing;

/// <summary>
/// Represents the event sourced aggregate interface.
/// </summary>
/// <typeparam name="TId">The type of the identifier.</typeparam>
public interface IEventSourcedAggregate<out TId> : IEventSourcedAggregate, IAggregateRoot<TId>
    where TId : TypedIdValueBase;

/// <summary>
/// Represents the event sourced aggregate interface.
/// </summary>
public interface IEventSourcedAggregate : IAggregateRoot
{
    /// <summary>
    /// Gets the version of this entity.
    /// </summary>
    int Version { get; }

    /// <summary>
    /// Loads the aggregate with the specified history.
    /// </summary>
    /// <param name="history">The history to load.</param>
    void Load(IEnumerable<IDomainEvent> history);

    /// <summary>
    /// Applies the specified event to the aggregate.
    /// </summary>
    /// <param name="event">The event to apply.</param>
    void ApplyEvent(IDomainEvent @event);
}
