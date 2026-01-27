using BuildingBlocks.Core.Persistence.MessagePersistence.Inbox;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Persistence.EfCore.Postgres.Configurations;

/// <summary>
/// Configuration for inbox messages.
/// </summary>
public sealed class InboxMessageConfiguration : IEntityTypeConfiguration<InboxMessage>
{
    /// <inheritdoc/>
    public void Configure(EntityTypeBuilder<InboxMessage> builder)
    {
        builder.ConfigureStoredMessage(
            tableName: MessageType.Inbox.GetStoredTableName(),
            indexPrefix: "inbox_messages"
        );
    }
}
