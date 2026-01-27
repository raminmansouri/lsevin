using BuildingBlocks.Core.ResultPattern;

namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the command bus.
/// </summary>
public interface ICommandBus
{
    /// <summary>
    /// Sends the command asynchronously.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="command">The command.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task<Result<TResponse>> SendAsync<TResponse>(
        ICommand<TResponse> command,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull;

    /// <summary>
    /// Enqueues the command asynchronously.
    /// </summary>
    /// <param name="command">The command.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task ScheduleAsync<T>(ICommand<T> command, CancellationToken cancellationToken = default)
        where T : notnull;

    /// <summary>
    /// Enqueues the command asynchronously.
    /// </summary>
    /// <param name="commands">The command.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task ScheduleAsync<T>(IEnumerable<ICommand<T>> commands, CancellationToken cancellationToken = default)
        where T : notnull;
}
