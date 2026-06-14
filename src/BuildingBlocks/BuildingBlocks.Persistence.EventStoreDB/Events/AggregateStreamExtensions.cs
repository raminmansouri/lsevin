using BuildingBlocks.Core.Domain.EventSourcing;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Persistence.EventStoreDB.Serialization;
using EventStore.Client;

namespace BuildingBlocks.Persistence.EventStoreDB.Events;

/// <summary>
/// Represents the aggregate stream extensions.
/// </summary>
public static class AggregateStreamExtensions
{
    /// <summary>
    /// Aggregates the stream.
    /// </summary>
    /// <typeparam name="T">The type of the aggregate.</typeparam>
    /// <typeparam name="TId">The type of the identifier.</typeparam>
    /// <param name="eventStore">The event store.</param>
    /// <param name="serializer">The serializer.</param>
    /// <param name="id">The identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <param name="fromVersion">The form version.</param>
    /// <returns>The aggregate.</returns>
    public static async Task<T?> AggregateStream<T, TId>(
        this EventStoreClient eventStore,
        ISerializer serializer,
        long id,
        CancellationToken cancellationToken,
        ulong? fromVersion = null
    )
        where T : class, IEventSourcedAggregate<TId>
        where TId : TypedIdValueBase
    {
        var readResult = eventStore.ReadStreamAsync(
            Direction.Forwards,
            StreamNameMapper.ToStreamId<T>(id),
            fromVersion ?? StreamPosition.Start,
            cancellationToken: cancellationToken
        );

        var aggregate = (T)Activator.CreateInstance(typeof(T), true)!;

        if (await readResult.ReadState == ReadState.StreamNotFound)
        {
            return null;
        }

        await foreach (var @event in readResult)
        {
            var eventData = @event.Deserialize(serializer) as IDomainEvent;

            aggregate.ApplyEvent(eventData!);
        }

        return aggregate;
    }
}
