using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Domain.EventSourcing;

/// <summary>
/// Serves as the base class for aggregate roots, providing common properties and methods for identity management and domain events handling.
/// </summary>
public abstract class EventSourcedAggregate<TId> : Entity<TId>, IEventSourcedAggregate<TId>
    where TId : TypedIdValueBase
{
    #region Properties

    /// <summary>
    /// Gets the version of this entity.
    /// </summary>
    public int Version { get; private set; } = -1;

    /// <summary>
    /// Holds the list of domain events associated with this entity.
    /// </summary>
    private readonly List<IDomainEvent> _domainEvents = [];

    /// <inheritdoc />
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    /// <summary>
    /// Gets the last snapshot version of this entity.
    /// </summary>
    public long LastSnapshotVersion { get; private set; } = -1;

    #endregion

    #region Events

    /// <summary>
    /// Adds a domain event to this entity.
    /// </summary>
    /// <param name="eventItem">The domain event to add.</param>
    public void AddDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }

    /// <inheritdoc />
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }

    /// <summary>
    /// Loads the aggregate with the specified history.
    /// </summary>
    /// <param name="history">The history to load.</param>
    public void Load(IEnumerable<IDomainEvent> history)
    {
        foreach (var @event in history)
        {
            ApplyEvent(@event);
        }
    }

    /// <inheritdoc />
    public void ApplyEvent(IDomainEvent @event)
    {
        ((dynamic)this).Apply((dynamic)@event);
        Version++;
    }

    /// <summary>
    /// Applies the specified event to the aggregate.
    /// </summary>
    /// <param name="event">The event to apply.</param>
    protected abstract void Apply(IDomainEvent @event);

    #endregion
}
