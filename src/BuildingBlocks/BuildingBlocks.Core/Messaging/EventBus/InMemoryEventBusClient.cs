using BuildingBlocks.Core.Messaging.Events;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.Messaging.EventBus;

/// <summary>
/// Represents the in-memory event bus client.
/// </summary>
internal sealed class InMemoryEventBusClient(IEventMapper eventMapper, ILogger<InMemoryEventBusClient> logger)
    : IEventBus
{
    /// <inheritdoc />
    public async Task PublishAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default) =>
        await PublishAsync([domainEvent], cancellationToken);

    /// <inheritdoc />
    public async Task PublishAsync(
        IReadOnlyList<IDomainEvent> domainEvents,
        CancellationToken cancellationToken = default
    )
    {
        if (domainEvents is { Count: 0 })
            return;

        logger.LogInformation("[EventBus] - Starting to publish {Count} domain events", domainEvents.Count);

        var integrationEvents = await MapDomainEventToIntegrationEventAsync(domainEvents).ConfigureAwait(false);

        if (!integrationEvents.Any())
        {
            logger.LogInformation("[EventBus] - No integration events mapped from domain events");
            return;
        }

        foreach (var integrationEvent in integrationEvents)
        {
            logger.LogInformation(
                "[EventBus] - Publishing integration event {EventType} with Id: {EventId}",
                integrationEvent.GetType().Name,
                integrationEvent.Id
            );

            await PublishAsync(integrationEvent, cancellationToken: cancellationToken);
        }

        logger.LogInformation(
            "[EventBus] - Successfully published {Count} integration events",
            integrationEvents.Count
        );
    }

    /// <inheritdoc />
    public async Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default)
        where T : IIntegrationEvent
    {
        logger.LogInformation("Publishing {Event}", @event.GetType().FullName);
        await InMemoryEventBus.Instance.PublishAsync(@event, cancellationToken);
    }

    /// <inheritdoc />
    public void Subscribe<T>(IIntegrationEventHandler<T> handler)
        where T : IIntegrationEvent
    {
        InMemoryEventBus.Instance.Subscribe(handler);
    }

    /// <summary>
    /// Maps the domain event to integration event.
    /// </summary>
    /// <param name="events">The events.</param>
    /// <returns>The integration events.</returns>
    private Task<IReadOnlyList<IIntegrationEvent>> MapDomainEventToIntegrationEventAsync(
        IReadOnlyList<IDomainEvent> events
    )
    {
        var integrationEvents = events.Select(@event => eventMapper.Map(@event)).OfType<IIntegrationEvent>().ToList();

        return Task.FromResult<IReadOnlyList<IIntegrationEvent>>(integrationEvents);
    }
}
