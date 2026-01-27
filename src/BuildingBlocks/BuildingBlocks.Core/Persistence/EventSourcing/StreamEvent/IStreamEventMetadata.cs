namespace BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;

/// <summary>
/// Represents the event metadata.
/// </summary>
public interface IStreamEventMetadata
{
    /// <summary>
    /// Gets the revision number of the event in the stream.
    /// </summary>
    public ulong StreamRevision { get; }

    /// <summary>
    /// Gets the global position of the event in the event log.
    /// </summary>
    public ulong LogPosition { get; }
}
