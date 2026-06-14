using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ProviderType.Data.Configurations;

internal sealed class ProviderTypeConfiguration
    : EntityConfigConfigurationContracts<ProviderTypeDomain>,
        IEntityTypeConfiguration<ProviderTypeDomain>
{
    public void Configure(EntityTypeBuilder<ProviderTypeDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ProviderTypeDomain> builder)
    {
        builder.ConfigureEntity<ProviderTypeDomain, ProviderTypeId>(
            nameof(ProviderType),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(pt => pt.Name)
            .ConfigureLocalizedStringNonNullable<ProviderTypeDomain>(
                nameof(ProviderTypeDomain.Name).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ProviderTypeNameMaxLength * 10
            );

        builder
            .Property(pt => pt.Description)
            .ConfigureLocalizedStringNonNullable<ProviderTypeDomain>(
                nameof(ProviderTypeDomain.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ProviderTypeDescriptionMaxLength * 10
            );

        builder
            .Property(pt => pt.IsActive)
            .HasColumnName(nameof(ProviderTypeDomain.IsActive).Underscore())
            .IsRequired();

        builder
            .Property(pt => pt.IconUrl)
            .HasColumnName(nameof(ProviderTypeDomain.IconUrl).Underscore())
            .HasMaxLength(250)
            .IsRequired(false);
    }

    public override void ConfigRelationships(EntityTypeBuilder<ProviderTypeDomain> builder)
    {
        builder
            .HasMany(b => b.AttributeDefinitions)
            .WithOne()
            .HasForeignKey(nameof(ProviderTypeId))
            .OnDelete(DeleteBehavior.Cascade);

        var attributeDefinitionsNavigation = builder.Metadata.FindNavigation(
            nameof(ProviderTypeDomain.AttributeDefinitions)
        );
        attributeDefinitionsNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<ProviderTypeDomain> builder) { }

    #endregion
}
