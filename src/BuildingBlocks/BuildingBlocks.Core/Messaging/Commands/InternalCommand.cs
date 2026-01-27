namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the base class for internal commands in the application.
/// </summary>
public abstract record InternalCommand : Command<bool>, IInternalCommand;
