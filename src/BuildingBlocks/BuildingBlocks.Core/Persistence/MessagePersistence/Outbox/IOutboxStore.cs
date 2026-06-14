using BuildingBlocks.Core.Messaging.Events;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Represents the outbox store.
/// </summary>
public interface IOutboxStore
{
    /// <summary>
    /// Saves the events asynchronously.
    /// </summary>
    /// <param name="outboxMessages">The outbox messages.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task SaveAsync(IEnumerable<OutboxMessage> outboxMessages, CancellationToken cancellationToken = default);
}
