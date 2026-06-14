using BuildingBlocks.Core.ResultPattern;

namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the command handler.
/// </summary>
/// <typeparam name="TCommand">The type of the command.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
public abstract class CommandHandler<TCommand, TResponse> : ICommandHandler<TCommand, TResponse>
    where TCommand : ICommand<TResponse>
    where TResponse : notnull
{
    /// <summary>
    /// Handles the specified command.
    /// </summary>
    /// <param name="command">The command.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns></returns>
    public abstract Task<Result<TResponse>> Handle(TCommand command, CancellationToken cancellationToken);
}
