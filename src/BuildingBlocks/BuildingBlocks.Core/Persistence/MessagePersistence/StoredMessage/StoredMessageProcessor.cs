using System.Data;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Resiliency.Options;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Web.Module;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Polly.Registry;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;

/// <summary>
/// Represents the stored message processor.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="StoredMessageProcessor"/> class.
/// </remarks>
/// <param name="dbConnectionFactory">The database connection factory.</param>
/// <param name="serviceScopeFactory">The service scope factory.</param>
/// <param name="serializer">The serializer.</param>
/// <param name="retryProvider">The retry provider.</param>
/// <param name="moduleInformation">The module information.</param>
/// <param name="logger">The logger.</param>
internal sealed class StoredMessageProcessor(
    IDbConnectionFactory dbConnectionFactory,
    IServiceScopeFactory serviceScopeFactory,
    ISerializer serializer,
    ResiliencePipelineProvider<string> retryProvider,
    IModuleInformation moduleInformation,
    ILogger<StoredMessageProcessor> logger
) : IStoredMessageProcessor
{
    /// <inheritdoc />
    public async Task Execute<TMessage>(
        MessageType type,
        StoredMessageOptions options,
        Func<TMessage, IServiceProvider, CancellationToken, Task> messageProcessor,
        CancellationToken cancellationToken = default
    )
        where TMessage : class
    {
        logger.LogInformation(
            "[StoredMessage] - {Module} - Beginning to process {Type} messages",
            moduleInformation.Name,
            type
        );

        await using var connection = await dbConnectionFactory
            .GetOrCreateConnectionAsync(cancellationToken)
            .ConfigureAwait(false);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);

        var storedMessages = await GetStoredMessagesAsync(
                connection,
                transaction,
                options,
                type.GetStoredTableName(),
                cancellationToken
            )
            .ConfigureAwait(false);

        foreach (var storedMessage in storedMessages)
        {
            Exception? exception = null;

            try
            {
                var message = serializer.Deserialize(storedMessage.Content, storedMessage.Type) as TMessage;
                Guard.Against.Null(message, nameof(message));

                var retry = retryProvider.GetPipeline(nameof(ResiliencyType.Shared));
                try
                {
                    await retry
                        .ExecuteAsync(
                            async token =>
                            {
                                await using var scope = serviceScopeFactory.CreateAsyncScope();
                                await messageProcessor(message, scope.ServiceProvider, token).ConfigureAwait(false);
                            },
                            cancellationToken
                        )
                        .ConfigureAwait(false);
                }
                catch (Exception retryException)
                {
                    logger.LogError(
                        retryException,
                        "[StoredMessage] - {Module} - Exception while processing {Type} message {MessageId}",
                        moduleInformation.Name,
                        type,
                        storedMessage.Id
                    );
                    exception = retryException;
                }
            }
            catch (Exception caughtException)
            {
                logger.LogError(
                    caughtException,
                    "[StoredMessage] - {Module} - Exception while processing {Type} message {MessageId}",
                    moduleInformation.Name,
                    type,
                    storedMessage.Id
                );

                exception = caughtException;
            }

            await UpdateStoredMessageAsync(
                    connection,
                    transaction,
                    storedMessage,
                    type.GetStoredTableName(),
                    exception,
                    cancellationToken
                )
                .ConfigureAwait(false);
        }

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

        logger.LogInformation(
            "[StoredMessage] - {Module} - Completed processing {Type} messages",
            moduleInformation.Name,
            type
        );
    }

    /// <summary>
    /// Gets the stored messages.
    /// </summary>
    /// <param name="connection">The database connection.</param>
    /// <param name="transaction">The database transaction.</param>
    /// <param name="options">The stored message options.</param>
    /// <param name="tableName">The table name.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The stored messages.</returns>
    private async Task<IReadOnlyList<StoredMessageResponse>> GetStoredMessagesAsync(
        IDbConnection connection,
        IDbTransaction transaction,
        StoredMessageOptions options,
        string tableName,
        CancellationToken cancellationToken = default
    )
    {
        var sql = $"""
            SELECT
               id AS {nameof(StoredMessageResponse.Id)},
               content AS {nameof(StoredMessageResponse.Content)},
               type AS {nameof(StoredMessageResponse.Type)}
            FROM {moduleInformation.Schema}.{tableName}
            FOR UPDATE
            """;

        var storedMessages = await connection
            .QueryAsync<StoredMessageResponse>(
                new CommandDefinition(sql, cancellationToken: cancellationToken, transaction: transaction)
            )
            .ConfigureAwait(false);

        return storedMessages.ToList();
    }

    /// <summary>
    /// Updates the stored message.
    /// </summary>
    /// <param name="connection">The database connection.</param>
    /// <param name="transaction">The database transaction.</param>
    /// <param name="storedMessage">The stored message.</param>
    /// <param name="tableName">The table name.</param>
    /// <param name="exception">The exception.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private Task<int> UpdateStoredMessageAsync(
        IDbConnection connection,
        IDbTransaction transaction,
        StoredMessageResponse storedMessage,
        string tableName,
        Exception? exception,
        CancellationToken cancellationToken = default
    )
    {
        string sql = $"""
            UPDATE {moduleInformation.Schema}.{tableName}
            SET processed_on_utc = @ProcessedOnUtc,
            WHERE id = @Id
            """;

        return connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    storedMessage.Id,
                    ProcessedOnUtc = SystemClock.Now,
                },
                cancellationToken: cancellationToken,
                transaction: transaction
            )
        );
    }

    /// <summary>
    /// Represents the stored message response.
    /// </summary>
    /// <param name="Id">The message id.</param>
    /// <param name="Content">The message content.</param>
    /// <param name="Type">The message type.</param>
    internal sealed record StoredMessageResponse(Guid Id, string Content, string Type);
}
