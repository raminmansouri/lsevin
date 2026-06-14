using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Inbox.Idempotency;

/// <summary>
/// Represents the configuration for the inbox message consumer.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="InboxMessageConsumerConfiguration"/> class.
/// </remarks>
public sealed class InboxMessageConsumerConfiguration : IEntityTypeConfiguration<InboxMessageConsumer>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<InboxMessageConsumer> builder)
    {
        builder.ConfigureStoredMessage(
            tableName: MessageType.Inbox.GetConsumerTableName(),
            indexPrefix: "inbox_message_consumers"
        );
    }
}
