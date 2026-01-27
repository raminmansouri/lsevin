using BuildingBlocks.Core.Domain.EventSourcing;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Persistence.EventSourcing.EventStore;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Types;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Represents the outbox event store decorator.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="OutboxEventStoreDecorator{T, TId}"/> class.
/// </remarks>
/// <param name="eventStore">The event store.</param>
/// <param name="outboxStore">The outbox store.</param>
/// <param name="serializer">The serializer.</param>
/// <param name="publisher">The publisher.</param>
/// <param name="notificationRegistry">The notification registry.</param>
public sealed class OutboxEventStoreDecorator<T, TId>(
    IEventStore<T, TId> eventStore,
    IOutboxStore outboxStore,
    ISerializer serializer,
    IEventPublisher publisher,
    IDomainNotificationRegistry notificationRegistry
) : IEventStore<T, TId>
    where T : class, IEventSourcedAggregate<TId>
    where TId : TypedIdValueBase
{
    /// <inheritdoc/>
    public Task<T?> FindAsync(long id, CancellationToken cancellationToken = default) =>
        eventStore.FindAsync(id, cancellationToken);

    /// <inheritdoc/>
    public async Task<ulong> AddAsync(T aggregate, CancellationToken cancellationToken = default)
    {
        await ProcessDomainEventsAsync(aggregate, cancellationToken).ConfigureAwait(false);
        return await eventStore.AddAsync(aggregate, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc/>
    public async Task<ulong> UpdateAsync(
        T aggregate,
        long? expectedRevision = null,
        CancellationToken cancellationToken = default
    )
    {
        await ProcessDomainEventsAsync(aggregate, cancellationToken).ConfigureAwait(false);
        return await eventStore.UpdateAsync(aggregate, expectedRevision, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc/>
    public async Task<ulong> DeleteAsync(
        T aggregate,
        long? expectedRevision = null,
        CancellationToken cancellationToken = default
    )
    {
        await ProcessDomainEventsAsync(aggregate, cancellationToken).ConfigureAwait(false);
        return await eventStore.DeleteAsync(aggregate, expectedRevision, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Processes the domain events.
    /// </summary>
    /// <param name="aggregate">The aggregate.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task ProcessDomainEventsAsync(T aggregate, CancellationToken cancellationToken)
    {
        List<IDomainNotificationEvent<IDomainEvent>> domainEventNotifications = [];
        var events = aggregate.DomainEvents.ToList();
        aggregate.ClearDomainEvents();

        foreach (var domainEvent in events)
        {
            await publisher.PublishAsync(domainEvent, cancellationToken).ConfigureAwait(false);

            var notificationEvent = TryCreateNotification(domainEvent);
            if (notificationEvent != null)
            {
                domainEventNotifications.Add(notificationEvent);
            }
        }

        if (domainEventNotifications.Count != 0)
        {
            var outboxMessages = domainEventNotifications.Select(notification => new OutboxMessage(
                Id: notification.Id,
                Type: TypeMapper.GetTypeName(notification.GetType()),
                Content: serializer.Serialize(notification, camelCase: false),
                OccurredOnUtc: notification.OccurredOn
            ));

            await outboxStore.SaveAsync(outboxMessages, cancellationToken).ConfigureAwait(false);
        }
    }

    /// <summary>
    /// Tries to create a notification event from the given domain event.
    /// </summary>
    /// <param name="domainEvent">The domain event.</param>
    /// <returns>The notification event, or null if no notification event could be created.</returns>
    private IDomainNotificationEvent<IDomainEvent>? TryCreateNotification(IDomainEvent domainEvent)
    {
        var notificationType = notificationRegistry.GetNotificationTypeFor(domainEvent.GetType());
        if (notificationType == null)
        {
            return null;
        }

        return (IDomainNotificationEvent<IDomainEvent>)Activator.CreateInstance(notificationType, domainEvent)!;
    }
}
