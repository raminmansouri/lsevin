using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox.Idempotency;

/// <summary>
/// Represents an outbox message consumer.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="OutboxMessageConsumer"/> class.
/// </remarks>
/// <param name="MessageId">The outbox message id.</param>
/// <param name="Name">The consumer name.</param>
public sealed record OutboxMessageConsumer(Guid MessageId, string Name)
    : MessageConsumer(MessageType.Outbox, MessageId, Name);
