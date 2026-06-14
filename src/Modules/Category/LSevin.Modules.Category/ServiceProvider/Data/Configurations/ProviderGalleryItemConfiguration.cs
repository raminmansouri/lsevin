using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceProvider.Data.Configurations;

internal sealed class ProviderGalleryItemConfiguration
    : EntityConfigConfigurationContracts<ProviderGalleryItem>,
        IEntityTypeConfiguration<ProviderGalleryItem>
{
    public void Configure(EntityTypeBuilder<ProviderGalleryItem> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ProviderGalleryItem> builder)
    {
        builder.ConfigureEntity<ProviderGalleryItem, ProviderGalleryItemId>(
            nameof(ProviderGalleryItem).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder.Property(nameof(ServiceProviderId)).HasColumnName(nameof(ServiceProviderId).Underscore()).IsRequired();

        builder
            .Property(gi => gi.Title)
            .ConfigureLocalizedStringNonNullable<ProviderGalleryItem>(
                nameof(ProviderGalleryItem.Title).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.GalleryItemTitleMaxLength * 10
            );

        builder
            .Property(gi => gi.Description)
            .ConfigureLocalizedStringNonNullable<ProviderGalleryItem>(
                nameof(ProviderGalleryItem.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.GalleryItemDescriptionMaxLength * 10
            );

        builder
            .Property(gi => gi.Url)
            .HasMaxLength(DomainConstValues.UrlMaxLength)
            .HasColumnName(nameof(ProviderGalleryItem.Url).Underscore())
            .IsRequired();

        builder
            .Property(gi => gi.MediaType)
            .HasMaxLength(50)
            .HasColumnName(nameof(ProviderGalleryItem.MediaType).Underscore())
            .IsRequired();

        builder
            .Property(gi => gi.DisplayOrder)
            .HasColumnName(nameof(ProviderGalleryItem.DisplayOrder).Underscore())
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ProviderGalleryItem> builder)
    {
        // The relationships are defined in the ServiceProviderConfiguration
    }

    public override void ConfigIndexes(EntityTypeBuilder<ProviderGalleryItem> builder)
    {
        builder.HasIndex(gi => gi.DisplayOrder);
    }

    #endregion
}
