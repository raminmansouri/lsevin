using BuildingBlocks.Core.ResultPattern;

namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the internal command handler.
/// </summary>
/// <typeparam name="TInternalCommand">The type of the internal command.</typeparam>
public abstract class InternalCommandHandler<TInternalCommand> : CommandHandler<TInternalCommand, bool>
    where TInternalCommand : IInternalCommand
{
    /// <summary>
    /// Handles the specified internal command.
    /// </summary>
    /// <param name="command">The internal command.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns></returns>
    public abstract override Task<Result<bool>> Handle(TInternalCommand command, CancellationToken cancellationToken);
}
