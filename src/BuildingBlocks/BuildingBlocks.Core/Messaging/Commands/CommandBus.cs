using BuildingBlocks.Core.ResultPattern;
using MediatR;

namespace BuildingBlocks.Core.Messaging.Commands;

/// <summary>
/// Represents the command bus.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="CommandBus"/> class.
/// </remarks>
/// <param name="mediator">The mediator.</param>
/// <param name="commandScheduler">The internal command store.</param>
internal sealed class CommandBus(ISender mediator, ICommandScheduler commandScheduler) : ICommandBus
{
    /// <inheritdoc />
    public async Task<Result<TResponse>> SendAsync<TResponse>(
        ICommand<TResponse> command,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull
    {
        var result = await mediator.Send(command, cancellationToken).ConfigureAwait(false);
        return result;
    }

    /// <inheritdoc />
    public async Task ScheduleAsync<TResponse>(
        ICommand<TResponse> command,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull
    {
        await commandScheduler.EnqueueAsync(command, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task ScheduleAsync<TResponse>(
        IEnumerable<ICommand<TResponse>> commands,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull
    {
        await commandScheduler.EnqueueAsync(commands, cancellationToken).ConfigureAwait(false);
    }
}
