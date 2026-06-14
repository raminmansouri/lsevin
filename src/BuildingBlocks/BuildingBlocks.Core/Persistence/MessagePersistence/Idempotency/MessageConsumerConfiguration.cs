using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Persistence.MessagePersistence.Idempotency;

/// <summary>
/// Extension methods for configuring stored message entities.
/// </summary>
public static class MessageConsumerConfiguration
{
    /// <summary>
    /// Configures common properties for stored message entities.
    /// </summary>
    public static void ConfigureStoredMessage<T>(
        this EntityTypeBuilder<T> builder,
        string tableName,
        string indexPrefix
    )
        where T : MessageConsumer
    {
        builder.ToTable(tableName);

        builder.HasKey(o => new { o.MessageId, o.Name });
        builder.Property(o => o.Name).HasMaxLength(EfConstants.Lenght.ExtraLong);

        builder.Ignore(x => x.MessageType);

        builder.HasIndex(b => new { b.MessageId, b.Name }).HasDatabaseName($"{indexPrefix}_message_id_name");
    }
}
