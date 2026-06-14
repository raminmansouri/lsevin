using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;

/// <summary>
/// Represents an inbox message.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="InboxMessage"/> class.
/// </remarks>
/// <param name="Id">The message id.</param>
/// <param name="Type">The message type.</param>
/// <param name="Content">The message content.</param>
/// <param name="OccurredOnUtc">The message occurred on UTC.</param>
/// <param name="ProcessedOnUtc">The message processed on UTC.</param>
/// <param name="Error">The error message.</param>
public record InboxMessage(
    Guid Id,
    string Type,
    string Content,
    DateTime OccurredOnUtc,
    DateTime? ProcessedOnUtc = null,
    string? Error = null
) : StoredMessage.StoredMessage(MessageType.Inbox, Id, Type, Content, OccurredOnUtc, ProcessedOnUtc, Error);
