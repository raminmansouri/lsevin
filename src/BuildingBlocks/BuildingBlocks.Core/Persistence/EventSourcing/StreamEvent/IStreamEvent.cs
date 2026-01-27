using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;

/// <summary>
/// Represents a stream event.
/// </summary>
public interface IStreamEvent : IEvent
{
    /// <summary>
    /// Gets the data.
    /// </summary>
    public IDomainEvent Data { get; }

    /// <summary>
    /// Gets the metadata.
    /// </summary>
    public IStreamEventMetadata? Metadata { get; }
}

/// <summary>
/// Represents a stream event.
/// </summary>
/// <typeparam name="T">The type of the event.</typeparam>
public interface IStreamEvent<out T> : IStreamEvent
    where T : IDomainEvent
{
    /// <summary>
    /// Gets the data.
    /// </summary>
    public new T Data { get; }
}
