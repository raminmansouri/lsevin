using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Represents the options for the outbox.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="OutboxOptions"/> class.
/// </remarks>
internal sealed class OutboxOptions : StoredMessageOptions;
