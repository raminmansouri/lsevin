using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Persistence.Context;
using BuildingBlocks.Core.Types;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.Persistence.Middlewares;

/// <summary>
/// Transaction behavior to manage transactions in the Mediator pipeline when we need to publish domain events directly from here.
/// </summary>
/// <typeparam name="TRequest">The type of the request.</typeparam>
/// <typeparam name="TResponse">The type of the response.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="TransactionBehavior{TRequest, TResponse}"/> class.
/// </remarks>
/// <param name="dbContext">The database context.</param>
/// <param name="logger">The logger.</param>
public sealed class TransactionBehavior<TRequest, TResponse>(
    IBaseDbContext dbContext,
    ILogger<TransactionBehavior<TRequest, TResponse>> logger
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IBaseCommand
    where TResponse : notnull
{
    /// <inheritdoc />
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var response = default(TResponse)!;
        var typeName = request.GetGenericTypeName();

        try
        {
            if (dbContext.HasActiveTransaction)
            {
                return await next(cancellationToken);
            }

            var strategy = dbContext.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await dbContext.BeginTransactionAsync(cancellationToken);
                ArgumentNullException.ThrowIfNull(transaction);

                KeyValuePair<string, object> keyValuePair = new("TransactionContext", transaction.TransactionId);
                IReadOnlyCollection<KeyValuePair<string, object>> state = [keyValuePair];
                using (logger.BeginScope(state: state))
                {
                    logger.LogInformation(
                        "[Transaction] - Begin transaction {TransactionId} for {CommandName} ({@Command})",
                        transaction.TransactionId,
                        typeName,
                        request
                    );

                    response = await next(cancellationToken);

                    logger.LogInformation(
                        "[Transaction] - Commit transaction {TransactionId} for {CommandName}",
                        transaction.TransactionId,
                        typeName
                    );

                    await dbContext.CommitTransactionAsync(transaction, cancellationToken);
                }
            });

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "[Transaction] - An error occurred during transaction for {CommandName} ({@Command})",
                typeName,
                request
            );

            throw;
        }
    }
}
