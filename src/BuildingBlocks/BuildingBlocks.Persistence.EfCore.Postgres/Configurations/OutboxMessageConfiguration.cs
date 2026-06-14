using BuildingBlocks.Core.Persistence.MessagePersistence.Outbox;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Persistence.EfCore.Postgres.Configurations;

/// <summary>
/// Configuration for outbox messages.
/// </summary>
public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    /// <inheritdoc/>
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ConfigureStoredMessage(
            tableName: MessageType.Outbox.GetStoredTableName(),
            indexPrefix: "outbox_messages"
        );
    }
}
