using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Types;
using MediatR;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand.Idempotency;

/// <summary>
/// Represents an idempotent internal command handler.
/// </summary>
/// <typeparam name="TCommand">The type of the command.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="IdempotencyInternalCommandHandler{TCommand}"/> class.
/// </remarks>
/// <param name="decorated">The decorated command handler.</param>
/// <param name="idempotencyService">The idempotency service.</param>
internal sealed class IdempotencyInternalCommandHandler<TCommand>(
    IRequestHandler<TCommand, Result<bool>> decorated,
    IIdempotencyService idempotencyService
) : IRequestHandler<TCommand, Result<bool>>
    where TCommand : ICommand<bool>
{
    /// <inheritdoc />
    public async Task<Result<bool>> Handle(TCommand command, CancellationToken cancellationToken)
    {
        var consumer = new InternalCommandMessageConsumer(command.Id, TypeMapper.GetTypeName(decorated.GetType()));

        var handled = await idempotencyService.HasBeenProcessedAsync(consumer, cancellationToken).ConfigureAwait(false);

        if (handled)
        {
            return Result.Success(true);
        }

        var result = await decorated.Handle(command, cancellationToken).ConfigureAwait(false);

        if (result.IsSuccess)
        {
            await idempotencyService.MarkAsProcessedAsync(consumer, cancellationToken).ConfigureAwait(false);
        }

        return result;
    }
}
