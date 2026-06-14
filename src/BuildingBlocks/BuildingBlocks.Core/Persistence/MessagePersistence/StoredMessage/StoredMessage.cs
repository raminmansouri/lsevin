namespace BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

/// <summary>
/// Represents a stored message in the system.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="StoredMessage"/> class.
/// </remarks>
/// <param name="MessageType">The type of the stored message.</param>
/// <param name="Id">The message id.</param>
/// <param name="Type">The message type.</param>
/// <param name="Content">The message content.</param>
/// <param name="OccurredOnUtc">The message occurred on UTC.</param>
/// <param name="ProcessedOnUtc">The message processed on UTC.</param>
/// <param name="Error">The error message.</param>
public record StoredMessage(
    MessageType MessageType,
    Guid Id,
    string Type,
    string Content,
    DateTime OccurredOnUtc,
    DateTime? ProcessedOnUtc = null,
    string? Error = null
);
