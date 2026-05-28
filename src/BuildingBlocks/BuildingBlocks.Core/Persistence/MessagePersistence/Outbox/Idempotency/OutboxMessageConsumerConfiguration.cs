using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Outbox.Idempotency;

/// <summary>
/// Represents the configuration for the outbox message consumer.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="OutboxMessageConsumerConfiguration"/> class.
/// </remarks>
public sealed class OutboxMessageConsumerConfiguration : IEntityTypeConfiguration<OutboxMessageConsumer>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<OutboxMessageConsumer> builder)
    {
        builder.ConfigureStoredMessage(
            tableName: MessageType.Outbox.GetConsumerTableName(),
            indexPrefix: "outbox_message_consumers"
        );
    }
}
