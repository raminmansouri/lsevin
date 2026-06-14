using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Customer.Entities;
using LSevin.Modules.Customer.Customer.ValueObjects;
using LSevin.Modules.Customer.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Customer.Customer.Data.Configurations;

internal sealed class CustomerDocumentConfiguration
    : EntityConfigConfigurationContracts<CustomerDocument>,
        IEntityTypeConfiguration<CustomerDocument>
{
    private const string DocumentTypeId = "_documentTypeId";

    public void Configure(EntityTypeBuilder<CustomerDocument> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<CustomerDocument> builder)
    {
        builder.ConfigureEntity<CustomerDocument, CustomerDocumentId>(
            nameof(CustomerDocument),
            CustomerContext.DefaultSchema
        );

        builder.Property<CustomerId>(nameof(CustomerId)).HasColumnName(nameof(CustomerId).Underscore()).IsRequired();

        builder
            .Property(b => b.DocumentUrl)
            .HasMaxLength(DomainConstValues.CustomerDocumentUrlMaxLength)
            .HasColumnName(nameof(CustomerDocument.DocumentUrl).Underscore())
            .IsRequired();

        builder.Property<int>(DocumentTypeId).HasColumnName(nameof(DocumentTypeId).Underscore()).IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<CustomerDocument> builder)
    {
        builder.HasOne(b => b.DocumentType).WithMany().HasForeignKey(DocumentTypeId).IsRequired();
    }

    public override void ConfigIndexes(EntityTypeBuilder<CustomerDocument> builder) { }

    #endregion
}
