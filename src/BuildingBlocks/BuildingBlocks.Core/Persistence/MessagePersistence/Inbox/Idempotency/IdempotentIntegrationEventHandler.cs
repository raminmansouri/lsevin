using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Types;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox.Idempotency;

/// <summary>
/// Represents an idempotent integration event handler.
/// </summary>
/// <typeparam name="TIntegrationEvent">The type of the integration event.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="IdempotentIntegrationEventHandler{TIntegrationEvent}"/> class.
/// </remarks>
/// <param name="decorated">The decorated integration event handler.</param>
/// <param name="idempotencyService">The idempotency service.</param>
internal sealed class IdempotentIntegrationEventHandler<TIntegrationEvent>(
    IIntegrationEventHandler<TIntegrationEvent> decorated,
    IIdempotencyService idempotencyService
) : IntegrationEventHandler<TIntegrationEvent>
    where TIntegrationEvent : IIntegrationEvent
{
    /// <inheritdoc />
    public override async Task Handle(TIntegrationEvent integrationEvent, CancellationToken cancellationToken = default)
    {
        var consumer = new InboxMessageConsumer(integrationEvent.Id, TypeMapper.GetTypeName(decorated.GetType()));

        var handled = await idempotencyService
            .HasBeenProcessedAsync(consumer, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        if (handled)
        {
            return;
        }

        await decorated.Handle(integrationEvent, cancellationToken).ConfigureAwait(false);

        await idempotencyService
            .MarkAsProcessedAsync(consumer, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
    }
}
