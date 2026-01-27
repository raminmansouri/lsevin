namespace BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

/// <summary>
/// Represents the type of stored message.
/// </summary>
public enum MessageType
{
    /// <summary>
    /// Integration event message type.
    /// </summary>
    Inbox = 1,

    /// <summary>
    /// Internal command message type.
    /// </summary>
    InternalCommand = 2,

    /// <summary>
    /// Outbox message type.
    /// </summary>
    Outbox = 3,
}
