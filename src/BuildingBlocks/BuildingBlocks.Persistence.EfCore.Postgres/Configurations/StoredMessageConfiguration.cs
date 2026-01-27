using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.MessagePersistence.StoredMessage;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Persistence.EfCore.Postgres.Configurations;

/// <summary>
/// Extension methods for configuring stored message entities.
/// </summary>
public static class StoredMessageConfiguration
{
    /// <summary>
    /// Configures common properties for stored message entities.
    /// </summary>
    public static void ConfigureStoredMessage<T>(
        this EntityTypeBuilder<T> builder,
        string tableName,
        string indexPrefix
    )
        where T : StoredMessage
    {
        builder.ToTable(tableName);

        builder.HasKey(x => x.Id);

        builder.Ignore(x => x.MessageType);

        builder.Property(x => x.Type).HasMaxLength(EfConstants.Lenght.Large).IsRequired();

        builder
            .Property(x => x.Content)
            .HasMaxLength(EfConstants.Lenght.UltraLong)
            .HasColumnType(EfConstants.ColumnTypes.Jsonb);

        builder.Property(x => x.OccurredOnUtc).HasColumnType(EfConstants.ColumnTypes.DateTime).IsRequired();

        builder.Property(x => x.ProcessedOnUtc).HasColumnType(EfConstants.ColumnTypes.DateTime);

        // Configure common indices
        builder.HasIndex(x => x.OccurredOnUtc).HasDatabaseName($"idx_{indexPrefix}_occurred_on");

        builder.HasIndex(x => x.ProcessedOnUtc).HasDatabaseName($"idx_{indexPrefix}_processed_on");

        builder
            .HasIndex(x => new { x.ProcessedOnUtc, x.OccurredOnUtc })
            .HasDatabaseName($"idx_{indexPrefix}_processed_occurred");

        // Configure unprocessed messages index
        builder
            .HasIndex(x => new { x.OccurredOnUtc, x.ProcessedOnUtc })
            .IncludeProperties(x => new
            {
                x.Id,
                x.Type,
                x.Content,
            })
            .HasFilter("processed_on_utc IS NULL")
            .HasDatabaseName($"idx_{indexPrefix}_unprocessed");
    }
}
