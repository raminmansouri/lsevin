using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand.Idempotency;

/// <summary>
/// Represents an internal command message consumer.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="InternalCommandMessageConsumer"/> class.
/// </remarks>
/// <param name="MessageId">The internal command message id.</param>
/// <param name="Name">The consumer name.</param>
public sealed record InternalCommandMessageConsumer(Guid MessageId, string Name)
    : MessageConsumer(MessageType.InternalCommand, MessageId, Name);
