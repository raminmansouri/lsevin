using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;

namespace BuildingBlocks.Core.Persistence.EventSourcing.Projections;

/// <summary>
/// Represents the projection publisher.
/// </summary>
public interface IProjectionPublisher
{
    /// <summary>
    /// Publishes the event asynchronously.
    /// </summary>
    /// <typeparam name="T">The type of the event.</typeparam>
    /// <param name="streamEvent">The stream event.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task PublishAsync<T>(StreamEvent<T> streamEvent, CancellationToken cancellationToken = default)
        where T : IDomainEvent;

    /// <summary>
    /// Publishes the event asynchronously.
    /// </summary>
    /// <param name="streamEvent">The stream event.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task PublishAsync(StreamEvent.StreamEvent streamEvent, CancellationToken cancellationToken = default);
}
