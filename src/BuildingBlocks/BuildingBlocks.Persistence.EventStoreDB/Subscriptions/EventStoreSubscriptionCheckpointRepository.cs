using BuildingBlocks.Core.Persistence.EventSourcing.Checkpoints;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Persistence.EventStoreDB.Serialization;
using EventStore.Client;

namespace BuildingBlocks.Persistence.EventStoreDB.Subscriptions;

/// <summary>
/// Represents the event store subscription checkpoint repository.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="EventStoreSubscriptionCheckpointRepository"/> class.
/// </remarks>
/// <param name="eventStoreClient">The event store client.</param>
/// <param name="serializer">The serializer.</param>
public class EventStoreSubscriptionCheckpointRepository(EventStoreClient eventStoreClient, ISerializer serializer)
    : ISubscriptionCheckpointRepository
{
    private readonly EventStoreClient _eventStoreClient =
        eventStoreClient ?? throw new ArgumentNullException(nameof(eventStoreClient));

    /// <inheritdoc />
    public async ValueTask<ulong?> LoadAsync(string subscriptionId, CancellationToken ct)
    {
        var streamName = GetCheckpointStreamName(subscriptionId);

        var result = _eventStoreClient.ReadStreamAsync(
            Direction.Backwards,
            streamName,
            StreamPosition.End,
            1,
            cancellationToken: ct
        );

        if (await result.ReadState == ReadState.StreamNotFound)
        {
            return null;
        }

        ResolvedEvent? @event = await result.FirstOrDefaultAsync(ct);

        return @event?.Deserialize<CheckpointStored>(serializer)?.Position;
    }

    /// <inheritdoc />
    public async ValueTask StoreAsync(string subscriptionId, ulong position, CancellationToken ct)
    {
        var @event = new CheckpointStored(subscriptionId, position, DateTime.UtcNow);
        var eventToAppend = new[] { @event.ToJsonEventData(serializer) };
        var streamName = GetCheckpointStreamName(subscriptionId);

        try
        {
            // store new checkpoint expecting stream to exist
            await _eventStoreClient.AppendToStreamAsync(
                streamName,
                StreamState.StreamExists,
                eventToAppend,
                cancellationToken: ct
            );
        }
        catch (WrongExpectedVersionException)
        {
            // WrongExpectedVersionException means that stream did not exist
            // Set the checkpoint stream to have at most 1 event
            // using stream metadata $maxCount property
            await _eventStoreClient.SetStreamMetadataAsync(
                streamName,
                StreamState.NoStream,
                new StreamMetadata(1),
                cancellationToken: ct
            );

            // append event again expecting stream to not exist
            await _eventStoreClient.AppendToStreamAsync(
                streamName,
                StreamState.NoStream,
                eventToAppend,
                cancellationToken: ct
            );
        }
    }

    /// <summary>
    /// Gets the checkpoint stream name.
    /// </summary>
    /// <param name="subscriptionId">The subscription identifier.</param>
    /// <returns>The checkpoint stream name.</returns>
    private static string GetCheckpointStreamName(string subscriptionId)
    {
        return $"checkpoint_{subscriptionId}";
    }
}
