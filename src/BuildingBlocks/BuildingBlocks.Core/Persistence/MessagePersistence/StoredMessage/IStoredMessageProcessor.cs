namespace BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

/// <summary>
/// Represents the stored message processor.
/// </summary>
public interface IStoredMessageProcessor
{
    /// <summary>
    /// Executes the specified message type with a custom message processor.
    /// </summary>
    /// <typeparam name="TMessage">The type of the message.</typeparam>
    /// <param name="type">The message type.</param>
    /// <param name="options">The options.</param>
    /// <param name="messageProcessor">The message processor delegate.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task Execute<TMessage>(
        MessageType type,
        StoredMessageOptions options,
        Func<TMessage, IServiceProvider, CancellationToken, Task> messageProcessor,
        CancellationToken cancellationToken = default
    )
        where TMessage : class;
}
