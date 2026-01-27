using BuildingBlocks.Core.ResultPattern;
using MediatR;

namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the command interface.
/// </summary>
/// <typeparam name="TResponse">The command response type.</typeparam>
public interface ICommand<TResponse> : IRequest<Result<TResponse>>, IBaseCommand
    where TResponse : notnull
{
    /// <summary>
    /// Gets the unique identifier of the command.
    /// </summary>
    Guid Id { get; }
}
