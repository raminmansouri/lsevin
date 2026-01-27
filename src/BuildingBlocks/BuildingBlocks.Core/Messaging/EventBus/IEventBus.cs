using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Messaging.EventBus;

/// <summary>
/// Represents the event bus interface.
/// </summary>
public interface IEventBus
{
    /// <summary>
    /// Publish the domain event.
    /// </summary>
    /// <param name="domainEvent">The domain event to publish.</param>
    /// <param name="cancellationToken">The cancellation token for the operation.</param>
    Task PublishAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish the domain events.
    /// </summary>
    /// <param name="domainEvents">The domain events to publish.</param>
    /// <param name="cancellationToken">The cancellation token for the operation.</param>
    Task PublishAsync(IReadOnlyList<IDomainEvent> domainEvents, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish the integration event.
    /// </summary>
    /// <param name="event">The integration event to publish.</param>
    /// <param name="cancellationToken">The cancellation token for the operation.</param>
    /// <typeparam name="T">The type of the integration event to publish.</typeparam>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default)
        where T : IIntegrationEvent;

    /// <summary>
    /// Subscribe to the integration event.
    /// </summary>
    /// <param name="handler">The integration event handler.</param>
    /// <typeparam name="T">The type of the integration event to subscribe to.</typeparam>
    void Subscribe<T>(IIntegrationEventHandler<T> handler)
        where T : IIntegrationEvent;
}
