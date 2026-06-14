namespace BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;

/// <summary>
/// Generic idempotency service for handling message processing.
/// </summary>
public interface IIdempotencyService
{
    /// <summary>
    /// Determines whether the specified consumer has been processed.
    /// </summary>
    /// <typeparam name="TConsumer">The type of the consumer.</typeparam>
    /// <param name="consumer">The consumer.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task<bool> HasBeenProcessedAsync<TConsumer>(TConsumer consumer, CancellationToken cancellationToken = default)
        where TConsumer : MessageConsumer;

    /// <summary>
    /// Marks the specified consumer as processed.
    /// </summary>
    /// <typeparam name="TConsumer">The type of the consumer.</typeparam>
    /// <param name="consumer">The consumer.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task MarkAsProcessedAsync<TConsumer>(TConsumer consumer, CancellationToken cancellationToken = default)
        where TConsumer : MessageConsumer;
}
