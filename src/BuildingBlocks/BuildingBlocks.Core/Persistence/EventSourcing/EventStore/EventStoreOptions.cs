namespace BuildingBlocks.Core.Persistence.EventSourcing.EventStore;

/// <summary>
/// Represents the event store DB options.
/// </summary>
public record EventStoreOptions(bool UseInternalCheckpointing = true);
