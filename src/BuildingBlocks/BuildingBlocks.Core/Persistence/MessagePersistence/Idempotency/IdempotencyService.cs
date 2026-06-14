using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using BuildingBlocks.Core.Web.Module;
using Dapper;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;

/// <summary>
/// Implementation of the idempotency service.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="IdempotencyService"/> class.
/// </remarks>
/// <param name="dbConnectionFactory">The database connection factory.</param>
/// <param name="moduleInformation">The module information.</param>
/// <param name="logger">The logger.</param>
internal sealed class IdempotencyService(
    IDbConnectionFactory dbConnectionFactory,
    IModuleInformation moduleInformation,
    ILogger<IdempotencyService> logger
) : IIdempotencyService
{
    /// <inheritdoc />
    public async Task<bool> HasBeenProcessedAsync<TConsumer>(
        TConsumer consumer,
        CancellationToken cancellationToken = default
    )
        where TConsumer : MessageConsumer
    {
        await using var connection = await dbConnectionFactory
            .GetOrCreateConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        logger.LogInformation("Checking if message has been processed");

        string sql = $"""
            SELECT EXISTS(
                SELECT 1
                FROM {moduleInformation.Schema}.{consumer.MessageType.GetConsumerTableName()}
                WHERE name = @Name)
            """;

        return await connection
            .ExecuteScalarAsync<bool>(
                new CommandDefinition(
                    sql,
                    new { consumer.Name },
                    cancellationToken: cancellationToken
                )
            )
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task MarkAsProcessedAsync<TConsumer>(TConsumer consumer, CancellationToken cancellationToken = default)
        where TConsumer : MessageConsumer
    {
        await using var connection = await dbConnectionFactory
            .GetOrCreateConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        string sql = $"""
            INSERT INTO {moduleInformation.Schema}.{consumer.MessageType.GetConsumerTableName()}(name)
            VALUES (@Name)
            """;

        await connection
            .ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new { consumer.Name },
                    cancellationToken: cancellationToken
                )
            )
            .ConfigureAwait(false);

    }
}
