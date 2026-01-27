using System.Text;
using BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Types;
using EventStore.Client;

namespace BuildingBlocks.Persistence.EventStoreDB.Serialization;

/// <summary>
/// Represents the event store serializer.
/// </summary>
public static class EventStoreSerializer
{
    /// <summary>
    /// Deserializes the specified resolved event.
    /// </summary>
    /// <typeparam name="T">The type of the object to deserialize.</typeparam>
    /// <param name="resolvedEvent">The resolved event.</param>
    /// <param name="serializer">The serializer.</param>
    /// <returns>The deserialized object.</returns>
    public static T? Deserialize<T>(this ResolvedEvent resolvedEvent, ISerializer serializer)
        where T : class => Deserialize(resolvedEvent, serializer) as T;

    /// <summary>
    /// Deserializes the specified resolved event.
    /// </summary>
    /// <param name="resolvedEvent">The resolved event.</param>
    /// <param name="serializer">The serializer.</param>
    /// <returns>The deserialized object.</returns>
    public static object? Deserialize(this ResolvedEvent resolvedEvent, ISerializer serializer)
    {
        var type = TypeMapper.GetType(resolvedEvent.Event.EventType);
        var payload = Encoding.UTF8.GetString(resolvedEvent.Event.Data.Span);

        return serializer.Deserialize(payload, type);
    }

    /// <summary>
    /// Converts the specified event to JSON event data.
    /// </summary>
    /// <param name="event">The event.</param>
    /// <param name="serializer">The serializer.</param>
    /// <param name="metaData">The meta data.</param>
    /// <returns>The JSON event data.</returns>
    public static EventData ToJsonEventData(
        this object @event,
        ISerializer serializer,
        StreamEventMetadata? metaData = null
    ) =>
        new(
            eventId: Uuid.NewUuid(),
            TypeMapper.ToName(@event.GetType()),
            data: Encoding.UTF8.GetBytes(serializer.Serialize(@event, camelCase: false)),
            metadata: Encoding.UTF8.GetBytes(serializer.Serialize(metaData ?? new object(), camelCase: false))
        );
}
