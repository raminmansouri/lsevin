using BuildingBlocks.Core.Persistence.MessagePersistence.InternalCommand;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Persistence.EfCore.Postgres.Configurations;

/// <summary>
/// Configuration for internal command messages.
/// </summary>
public sealed class InternalCommandMessageConfiguration : IEntityTypeConfiguration<InternalCommandMessage>
{
    /// <inheritdoc/>
    public void Configure(EntityTypeBuilder<InternalCommandMessage> builder)
    {
        builder.ConfigureStoredMessage(
            tableName: MessageType.InternalCommand.GetStoredTableName(),
            indexPrefix: "internal_command_messages"
        );
    }
}
