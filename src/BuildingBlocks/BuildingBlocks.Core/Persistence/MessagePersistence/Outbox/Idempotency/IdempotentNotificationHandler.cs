using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Types;
using MediatR;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox.Idempotency;

/// <summary>
/// Represents an idempotent notification handler.
/// </summary>
/// <typeparam name="TNotification">The type of the notification.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="IdempotentNotificationHandler{TNotification}"/> class.
/// </remarks>
/// <param name="decorated">The decorated notification handler.</param>
/// <param name="idempotencyService">The idempotency service.</param>
internal sealed class IdempotentNotificationHandler<TNotification>(
    INotificationHandler<TNotification> decorated,
    IIdempotencyService idempotencyService
) : INotificationHandler<TNotification>
    where TNotification : INotification
{
    /// <inheritdoc />
    public async Task Handle(TNotification notification, CancellationToken cancellationToken)
    {
        if (notification is not IDomainNotificationEvent domainNotification)
        {
            await decorated.Handle(notification, cancellationToken).ConfigureAwait(false);
            return;
        }

        var consumer = new OutboxMessageConsumer(domainNotification.Id, TypeMapper.GetTypeName(decorated.GetType()));

        var handled = await idempotencyService.HasBeenProcessedAsync(consumer, cancellationToken).ConfigureAwait(false);

        if (handled)
        {
            return;
        }

        await decorated.Handle(notification, cancellationToken).ConfigureAwait(false);

        await idempotencyService.MarkAsProcessedAsync(consumer, cancellationToken).ConfigureAwait(false);
    }
}
