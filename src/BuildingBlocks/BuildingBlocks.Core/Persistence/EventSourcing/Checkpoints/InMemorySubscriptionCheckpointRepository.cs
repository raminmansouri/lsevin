using System.Collections.Concurrent;

namespace BuildingBlocks.Core.Persistence.EventSourcing.Checkpoints;

/// <summary>
/// Represents the in-memory subscription checkpoint repository.
/// </summary>
public class InMemorySubscriptionCheckpointRepository : ISubscriptionCheckpointRepository
{
    /// <summary>
    /// The checkpoints.
    /// </summary>
    private readonly ConcurrentDictionary<string, ulong> _checkpoints = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public ValueTask<ulong?> LoadAsync(string subscriptionId, CancellationToken ct)
    {
        return new ValueTask<ulong?>(_checkpoints.TryGetValue(subscriptionId, out var checkpoint) ? checkpoint : null);
    }

    /// <inheritdoc />
    public ValueTask StoreAsync(string subscriptionId, ulong position, CancellationToken ct)
    {
        _checkpoints.AddOrUpdate(subscriptionId, position, (_, _) => position);

        return ValueTask.CompletedTask;
    }
}
