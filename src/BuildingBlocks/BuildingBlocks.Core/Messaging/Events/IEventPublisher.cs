namespace BuildingBlocks.Core.Messaging.Events;

/// <summary>
/// Represents the event publisher.
/// </summary>
public interface IEventPublisher
{
    /// <summary>
    /// Publishes the event asynchronously.
    /// </summary>
    /// <param name="event">The event.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task PublishAsync(object @event, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publishes the events asynchronously.
    /// </summary>
    /// <typeparam name="T">The type of the event.</typeparam>
    /// <param name="eventsData">The events' data.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task PublishAsync<T>(IEnumerable<T> eventsData, CancellationToken cancellationToken = default)
        where T : class, IDomainEvent;
}
