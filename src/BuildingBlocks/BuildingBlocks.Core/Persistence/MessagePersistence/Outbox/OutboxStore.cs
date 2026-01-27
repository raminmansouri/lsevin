using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Web.Module;
using Dapper;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;

/// <summary>
/// Represents the outbox store.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="SqlOutboxStore"/> class.
/// </remarks>
/// <param name="dbConnectionFactory">The database connection factory.</param>
/// <param name="moduleInformation">The module information.</param>
internal sealed class SqlOutboxStore(IDbConnectionFactory dbConnectionFactory, IModuleInformation moduleInformation)
    : IOutboxStore
{
    /// <inheritdoc />
    public async Task SaveAsync(
        IEnumerable<OutboxMessage> outboxMessages,
        CancellationToken cancellationToken = default
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var data = outboxMessages
            .Select(outbox => new
            {
                outbox.Id,
                outbox.Type,
                outbox.Content,
                outbox.OccurredOnUtc,
            })
            .ToList();

        string sql = $"""
            INSERT INTO {moduleInformation.Schema}.outbox_messages (id, type, content, occurred_on_utc)
            VALUES (@Id, @Type, @Content::json, @OccurredOnUtc)
            """;

        await connection.ExecuteAsync(new CommandDefinition(sql, data, cancellationToken: cancellationToken));
    }
}
