using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;

/// <summary>
/// Base record for message consumers.
/// </summary>
public abstract record MessageConsumer(MessageType MessageType, Guid MessageId, string Name);
