using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ProviderType.Entities;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProviderAttributeDefinitionDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderAttributeDefinition;

namespace LSevin.Modules.Category.ProviderType.Data.Configurations;

internal sealed class ProviderAttributeDefinitionConfiguration
    : EntityConfigConfigurationContracts<ProviderAttributeDefinitionDomain>,
        IEntityTypeConfiguration<ProviderAttributeDefinitionDomain>
{
    private const string AttributeTypeId = "_attributeTypeId";

    public void Configure(EntityTypeBuilder<ProviderAttributeDefinitionDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ProviderAttributeDefinitionDomain> builder)
    {
        builder.ConfigureEntity<ProviderAttributeDefinitionDomain, ProviderAttributeDefinitionId>(
            nameof(ProviderAttributeDefinition),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(pad => pad.Name)
            .ConfigureLocalizedStringNonNullable<ProviderAttributeDefinitionDomain>(
                nameof(ProviderAttributeDefinitionDomain.Name).Underscore() + EfConstants.LocalizedTablePostfix
            // DomainConstValues.ProviderAttributeNameMaxLength * 10
            );

        builder
            .Property(pad => pad.Description)
            .ConfigureLocalizedStringNonNullable<ProviderAttributeDefinitionDomain>(
                nameof(ProviderAttributeDefinitionDomain.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // DomainConstValues.ProviderAttributeDescriptionMaxLength * 10
            );

        builder.Property<int>(AttributeTypeId).HasColumnName(nameof(AttributeTypeId).Underscore()).IsRequired();

        builder
            .Property(pad => pad.IsRequired)
            .HasColumnName(nameof(ProviderAttributeDefinitionDomain.IsRequired).Underscore())
            .IsRequired();

        builder
            .Property(pad => pad.ValidationRules)
            .HasMaxLength(DomainConstValues.ProviderAttributeValidationRulesMaxLength)
            .HasColumnName(nameof(ProviderAttributeDefinitionDomain.ValidationRules).Underscore());

        builder.Property(nameof(ProviderTypeId)).HasColumnName(nameof(ProviderTypeId).Underscore()).IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ProviderAttributeDefinitionDomain> builder)
    {
        builder.HasOne(b => b.AttributeType).WithMany().HasForeignKey(AttributeTypeId).IsRequired();

        builder.OwnsMany(
            pad => pad.Options,
            opt =>
            {
                opt.ToTable(
                    $"{nameof(ProviderAttributeDefinitionDomain)}{nameof(ProviderAttributeDefinitionDomain.Options)}"
                        .Pluralize()
                        .Underscore(),
                    CategoryContext.DefaultSchema
                );
                opt.WithOwner().HasForeignKey(nameof(ProviderAttributeDefinitionId));
                opt.Configure();
            }
        );
    }

    public override void ConfigIndexes(EntityTypeBuilder<ProviderAttributeDefinitionDomain> builder) { }

    #endregion
}
