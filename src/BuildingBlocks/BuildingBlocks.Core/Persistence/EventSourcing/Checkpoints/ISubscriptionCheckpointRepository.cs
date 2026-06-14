namespace BuildingBlocks.Core.Persistence.EventSourcing.Checkpoints;

/// <summary>
/// Represents the subscription checkpoint repository.
/// </summary>
public interface ISubscriptionCheckpointRepository
{
    /// <summary>
    /// Loads the checkpoint for the specified subscription.
    /// </summary>
    /// <param name="subscriptionId">The subscription identifier.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The checkpoint position.</returns>
    ValueTask<ulong?> LoadAsync(string subscriptionId, CancellationToken ct);

    /// <summary>
    /// Stores the checkpoint for the specified subscription.
    /// </summary>
    /// <param name="subscriptionId">The subscription identifier.</param>
    /// <param name="position">The checkpoint position.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    ValueTask StoreAsync(string subscriptionId, ulong position, CancellationToken ct);
}
