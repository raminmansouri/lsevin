namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the command scheduler.
/// </summary>
public interface ICommandScheduler
{
    /// <summary>
    /// Enqueues the command asynchronously.
    /// </summary>
    /// <param name="command">The command.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task EnqueueAsync<T>(ICommand<T> command, CancellationToken cancellationToken = default)
        where T : notnull;

    /// <summary>
    /// Enqueues the command asynchronously.
    /// </summary>
    /// <param name="commands">The command.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task EnqueueAsync<T>(IEnumerable<ICommand<T>> commands, CancellationToken cancellationToken = default)
        where T : notnull;
}
