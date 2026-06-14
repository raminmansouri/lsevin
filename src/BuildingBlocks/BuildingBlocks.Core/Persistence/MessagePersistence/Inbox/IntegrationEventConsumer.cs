using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Serialization;
using BuildingBlocks.Core.Types;
using BuildingBlocks.Core.Web.Module;
using Dapper;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;

/// <summary>
/// Represents the integration event consumer.
/// </summary>
/// <typeparam name="TIntegrationEvent">The type of the integration event.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="IntegrationEventConsumer{TIntegrationEvent}"/> class.
/// </remarks>
/// <param name="dbConnectionFactory">The database connection factory.</param>
/// <param name="serializer">The serializer.</param>
/// <param name="moduleInformation">The module information.</param>
internal sealed class IntegrationEventConsumer<TIntegrationEvent>(
    IDbConnectionFactory dbConnectionFactory,
    ISerializer serializer,
    IModuleInformation moduleInformation
) : IntegrationEventHandler<TIntegrationEvent>
    where TIntegrationEvent : IIntegrationEvent
{
    /// <inheritdoc />
    public override async Task Handle(TIntegrationEvent notification, CancellationToken cancellationToken = default)
    {
        await using var connection = await dbConnectionFactory
            .GetOrCreateConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        var inboxMessage = new InboxMessage(
            notification.Id,
            Type: TypeMapper.GetTypeName(notification.GetType()),
            Content: serializer.Serialize(notification, camelCase: false),
            notification.OccurredOn
        );

        string sql = $"""
            INSERT INTO {moduleInformation.Schema}.inbox_messages(id, type, content, occurred_on_utc)
            VALUES (@Id, @Type, @Content::json, @OccurredOnUtc)
            """;

        await connection
            .ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        inboxMessage.Id,
                        inboxMessage.Type,
                        inboxMessage.Content,
                        inboxMessage.OccurredOnUtc,
                    },
                    cancellationToken: cancellationToken
                )
            )
            .ConfigureAwait(false);
    }
}
