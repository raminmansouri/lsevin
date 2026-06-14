using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Represents the contract of an aggregate root in the domain-driven design (DDD) context.
/// </summary>
/// <typeparam name="T">The type of the unique identifier for this entity.</typeparam>
public interface IAggregateRoot<out T> : IAggregateRoot, IEntity<T>
    where T : TypedIdValueBase;

/// <summary>
/// Represents the contract of an aggregate root in the domain-driven design (DDD) context.
/// Aggregate roots are the entry points to the aggregates they control and ensure
/// consistency rules are adhered to within the aggregate boundaries.
/// </summary>
public interface IAggregateRoot : IEntity
{
    /// <summary>
    /// Gets the version of this entity.
    /// </summary>
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }

    /// <summary>
    /// Adds a domain event to this entity.
    /// </summary>
    void ClearDomainEvents();

    /// <summary>
    /// Adds a domain event to this entity.
    /// </summary>
    /// <param name="eventItem">The domain event to add.</param>
    void AddDomainEvent(IDomainEvent eventItem);
}
