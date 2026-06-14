using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Serves as the base class for aggregate roots, providing common properties and methods for identity management and domain events handling.
/// </summary>
public abstract class AggregateRoot<TId> : Entity<TId>, IAggregateRoot<TId>
    where TId : TypedIdValueBase
{
    #region Properties

    /// <summary>
    /// Holds the list of domain events associated with this entity.
    /// </summary>
    private readonly List<IDomainEvent> _domainEvents = [];

    /// <inheritdoc />
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    #endregion

    #region Events

    /// <inheritdoc />
    public void AddDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }

    /// <summary>
    /// Removes a domain event from this entity.
    /// </summary>
    /// <param name="eventItem">The domain event to remove.</param>
    public void RemoveDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents.Remove(eventItem);
    }

    /// <inheritdoc />
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }

    #endregion
}
