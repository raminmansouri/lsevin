using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox.Idempotency;

/// <summary>
/// Represents an inbox message consumer.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="InboxMessageConsumer"/> class.
/// </remarks>
/// <param name="MessageId">The inbox message id.</param>
/// <param name="Name">The consumer name.</param>
public sealed record InboxMessageConsumer(Guid MessageId, string Name)
    : MessageConsumer(MessageType.Inbox, MessageId, Name);
