using BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand.Idempotency;

/// <summary>
/// Represents the configuration for the internal command  message consumer.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="InternalCommandMessageConsumerConfiguration"/> class.
/// </remarks>
public sealed class InternalCommandMessageConsumerConfiguration
    : IEntityTypeConfiguration<InternalCommandMessageConsumer>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<InternalCommandMessageConsumer> builder)
    {
        builder.ConfigureStoredMessage(
            tableName: MessageType.InternalCommand.GetConsumerTableName(),
            indexPrefix: "internal_command_message_consumers"
        );
    }
}
