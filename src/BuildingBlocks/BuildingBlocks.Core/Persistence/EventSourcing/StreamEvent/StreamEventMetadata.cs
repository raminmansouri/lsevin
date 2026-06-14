namespace BuildingBlocks.Core.Persistence.EventSourcing.StreamEvent;

/// <summary>
/// Represents the event metadata.
/// </summary>
/// <param name="StreamRevision">The stream revision.</param>
/// <param name="LogPosition">The log position.</param>
public record StreamEventMetadata(ulong StreamRevision, ulong LogPosition) : IStreamEventMetadata;
