using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Types;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Represents an interceptor for inserting outbox messages.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="InsertOutboxMessagesInterceptor"/> class.
/// </remarks>
/// <param name="publisher">The event publisher.</param>
/// <param name="notificationRegistry">The notification registry.</param>
/// <param name="serializer">The serializer.</param>
public sealed class InsertOutboxMessagesInterceptor(
    IEventPublisher publisher,
    IDomainNotificationRegistry notificationRegistry,
    ISerializer serializer
) : SaveChangesInterceptor
{
    /// <inheritdoc />
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default
    )
    {
        if (eventData.Context is not null)
        {
            await ProcessDomainEventsAsync(eventData.Context, cancellationToken).ConfigureAwait(false);
        }

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    /// <summary>
    /// Inserts the outbox messages.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    private async Task ProcessDomainEventsAsync(DbContext context, CancellationToken cancellationToken)
    {
        List<IDomainNotificationEvent<IDomainEvent>> domainEventNotifications = [];

        var domainEntities = context
            .ChangeTracker.Entries<IAggregateRoot>()
            .Where(x => x.Entity.DomainEvents is { Count: > 0 })
            .ToList();

        foreach (var entity in domainEntities)
        {
            var events = entity.Entity.DomainEvents.ToList();
            entity.Entity.ClearDomainEvents();

            foreach (var domainEvent in events)
            {
                // First publish the original domain event locally
                await publisher.PublishAsync(domainEvent, cancellationToken).ConfigureAwait(false);

                // Try to create notification if registered
                var notificationEvent = TryCreateNotification(domainEvent);

                if (notificationEvent != null)
                {
                    domainEventNotifications.Add(notificationEvent);
                }
            }
        }

        if (domainEventNotifications.Count != 0)
        {
            var outboxMessages = domainEventNotifications.ConvertAll(notification => new OutboxMessage(
                Id: notification.Id,
                Type: TypeMapper.GetTypeName(notification.GetType()),
                Content: serializer.Serialize(notification, camelCase: false),
                OccurredOnUtc: notification.OccurredOn
            ));

            context.Set<OutboxMessage>().AddRange(outboxMessages);
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
