using BuildingBlocks.Core.Domain.EventSourcing;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Persistence.EventSourcing.EventStore;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Persistence.EventStoreDB.Events;
using BuildingBlocks.Persistence.EventStoreDB.Serialization;
using EventStore.Client;

namespace BuildingBlocks.Persistence.EventStoreDB.Repository;

/// <summary>
/// Represents the event store repository.
/// </summary>
/// <typeparam name="T">The type of the aggregate.</typeparam>
/// <typeparam name="TId">The type of the identifier.</typeparam>
/// <param name="eventStore">The event store.</param>
/// <param name="serializer">The serializer.</param>
public class EventStoreRepository<T, TId>(EventStoreClient eventStore, ISerializer serializer) : IEventStore<T, TId>
    where T : class, IEventSourcedAggregate<TId>
    where TId : TypedIdValueBase
{
    private readonly EventStoreClient _eventStore = eventStore ?? throw new ArgumentNullException(nameof(eventStore));

    /// <inheritdoc />
    public Task<T?> FindAsync(long id, CancellationToken cancellationToken = default) =>
        eventStore.AggregateStream<T, TId>(serializer: serializer, id: id, cancellationToken: cancellationToken);

    /// <inheritdoc />
    public async Task<ulong> AddAsync(T aggregate, CancellationToken cancellationToken = default)
    {
        var result = await _eventStore.AppendToStreamAsync(
            StreamNameMapper.ToStreamId<T>(aggregate.Id),
            StreamState.NoStream,
            GetEventsToStore(aggregate),
            cancellationToken: cancellationToken
        );
        return result.NextExpectedStreamRevision;
    }

    /// <inheritdoc />
    public async Task<ulong> UpdateAsync(
        T aggregate,
        long? expectedRevision = null,
        CancellationToken cancellationToken = default
    )
    {
        var nextVersion = expectedRevision ?? aggregate.Version;

        var result = await _eventStore.AppendToStreamAsync(
            StreamNameMapper.ToStreamId<T>(aggregate.Id),
            (ulong)nextVersion,
            GetEventsToStore(aggregate),
            cancellationToken: cancellationToken
        );
        return result.NextExpectedStreamRevision;
    }

    /// <inheritdoc />
    public Task<ulong> DeleteAsync(
        T aggregate,
        long? expectedRevision = null,
        CancellationToken cancellationToken = default
    ) => UpdateAsync(aggregate, expectedRevision, cancellationToken);

    /// <summary>
    /// Gets the events to store.
    /// </summary>
    /// <param name="aggregate">The aggregate.</param>
    /// <returns>The events to store.</returns>
    private IEnumerable<EventData> GetEventsToStore(T aggregate)
    {
        var domainEvents = aggregate.DomainEvents;
        aggregate.ClearDomainEvents();

        return domainEvents.Select(e => e.ToJsonEventData(serializer));
    }
}
