namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents internal command handler.
/// </summary>
/// <typeparam name="TInternalCommand">The type of the internal command.</typeparam>
public interface IInternalCommandHandler<in TInternalCommand> : ICommandHandler<TInternalCommand, bool>
    where TInternalCommand : IInternalCommand;
