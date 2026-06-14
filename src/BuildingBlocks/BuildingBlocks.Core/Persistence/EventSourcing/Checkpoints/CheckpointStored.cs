using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Persistence.EventSourcing.Checkpoints;

/// <summary>
/// Represents the checkpoint stored event.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="CheckpointStored"/> class.
/// </remarks>
/// <param name="SubscriptionId">The subscription identifier.</param>
/// <param name="Position">The position.</param>
/// <param name="CheckpointedAt">The checkpointed at.</param>
public record CheckpointStored(string SubscriptionId, ulong? Position, DateTime CheckpointedAt) : IDomainEvent;
