using BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Persistence.EventStoreDB.Serialization;
using EventStore.Client;

namespace BuildingBlocks.Persistence.EventStoreDB.Events;

/// <summary>
/// Represents the stream event extensions.
/// </summary>
public static class StreamEventExtensions
{
    /// <summary>
    /// Converts the specified resolved event to stream event.
    /// </summary>
    /// <param name="resolvedEvent">The resolved event.</param>
    /// <param name="serializer">The serializer.</param>
    /// <returns>The stream event.</returns>
    public static StreamEvent? ToStreamEvent(this ResolvedEvent resolvedEvent, ISerializer serializer)
    {
        var eventData = resolvedEvent.Deserialize(serializer);
        if (eventData == null)
        {
            return null;
        }

        var metaData = new StreamEventMetadata(
            resolvedEvent.Event.EventNumber.ToUInt64(),
            resolvedEvent.Event.Position.CommitPosition
        );
        var type = typeof(StreamEvent<>).MakeGenericType(eventData.GetType());
        return (StreamEvent)Activator.CreateInstance(type, eventData, metaData)!;
    }
}
