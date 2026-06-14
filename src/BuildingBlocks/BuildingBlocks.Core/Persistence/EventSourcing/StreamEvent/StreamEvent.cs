using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;

/// <summary>
/// Represents a stream event.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="StreamEvent"/> class.
/// </remarks>
/// <param name="Data">The data.</param>
/// <param name="Metadata">The metadata.</param>
public record StreamEvent(IDomainEvent Data, IStreamEventMetadata? Metadata = null) : IStreamEvent;

/// <summary>
/// Represents a stream event.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="StreamEvent{T}"/> class.
/// </remarks>
/// <typeparam name="T">The type of the event.</typeparam>
/// <param name="Data">The data.</param>
/// <param name="Metadata">The metadata.</param>
public record StreamEvent<T>(T Data, IStreamEventMetadata? Metadata = null) : StreamEvent(Data, Metadata)
    where T : IDomainEvent
{
    /// <summary>
    /// Gets the strongly typed event data.
    /// </summary>
    /// <returns>The event data of type T.</returns>
    public new T Data => (T)base.Data;
}
