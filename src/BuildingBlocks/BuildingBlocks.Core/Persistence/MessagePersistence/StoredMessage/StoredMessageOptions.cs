namespace BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

/// <summary>
/// Represents the options for the stored message.
/// </summary>
public abstract class StoredMessageOptions
{
    /// <summary>
    /// Gets the interval in seconds.
    /// </summary>
    public int IntervalInSeconds { get; init; }

    /// <summary>
    /// Gets the batch size.
    /// </summary>
    public int BatchSize { get; init; }
}
