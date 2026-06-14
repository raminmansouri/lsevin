using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Consulting.ValueObjects;
using LSevin.Modules.Customer.Customer.ValueObjects;
using LSevin.Modules.Customer.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ConsultingDomain = LSevin.Modules.Customer.Consulting.Entities.Consulting;
using CustomerDomain = LSevin.Modules.Customer.Customer.Entities.Customer;

namespace LSevin.Modules.Customer.Consulting.Data.Configuration;

internal sealed class ConsultingConfiguration
    : EntityConfigConfigurationContracts<ConsultingDomain>,
        IEntityTypeConfiguration<ConsultingDomain>
{
    public void Configure(EntityTypeBuilder<ConsultingDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ConsultingDomain> builder)
    {
        builder.ConfigureEntity<ConsultingDomain, ConsultingId>(nameof(Consulting), CustomerContext.DefaultSchema);

        builder.Property(b => b.CustomerId).IsRequired();

        builder
            .Property(p => p.Description)
            .HasColumnName(nameof(ConsultingDomain.Description).Underscore())
            .HasMaxLength(DomainConstValues.ConsultingDescriptionMaxLength)
            .IsRequired();

        builder
            .Property(b => b.CategoryId)
            .HasColumnName(nameof(ConsultingDomain.CategoryId).Underscore())
            .IsRequired();
        builder
            .Property(b => b.CategoryName)
            .HasColumnName(nameof(ConsultingDomain.CategoryName).Underscore())
            .HasMaxLength(DomainConstValues.ConsultingCategoryNameMaxLength)
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ConsultingDomain> builder)
    {
        builder
            .HasOne<CustomerDomain>()
            .WithMany()
            .IsRequired()
            .HasForeignKey(b => b.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.OwnsMany(
            b => b.Documents,
            ba =>
                ba.ConfigureOwnedNavigatorEntity<ConsultingDomain, ConsultingId, ConsultingSelectedDocumentReference>(
                    tableName: nameof(ConsultingSelectedDocumentReference),
                    schemaName: CustomerContext.DefaultSchema,
                    parentIdentifierName: nameof(ConsultingId),
                    initialConfig: ba =>
                    {
                        ba.Configure();

                        ba.HasKey(nameof(ConsultingId), nameof(CustomerDocumentId));
                    }
                )
        );
    }

    public override void ConfigIndexes(EntityTypeBuilder<ConsultingDomain> builder)
    {
        builder.HasIndex(b => b.CategoryId);
    }

    #endregion
}
