using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.Location.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LocationDomain = LSevin.Modules.Category.Location.Entities.Location;

namespace LSevin.Modules.Category.Location.Data.Configurations;

internal sealed class LocationConfiguration
    : EntityConfigConfigurationContracts<LocationDomain>,
        IEntityTypeConfiguration<LocationDomain>
{
    private const string LocationTypeId = "_locationTypeId";

    public void Configure(EntityTypeBuilder<LocationDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<LocationDomain> builder)
    {
        builder.ConfigureEntity<LocationDomain, LocationId>(nameof(Location), CategoryContext.DefaultSchema);

        builder
            .Property(l => l.Code)
            .HasMaxLength(10) // Assuming a reasonable max length for location codes like 'IR' or 'TH'
            .HasColumnName(nameof(LocationDomain.Code).Underscore())
            .IsRequired();

        builder
            .Property(l => l.Value)
            .ConfigureLocalizedStringNonNullable<LocationDomain>(
                nameof(LocationDomain.Value).Underscore() + EfConstants.LocalizedTablePostfix
            );

        builder.Property(l => l.DisplayOrder).HasColumnName(nameof(LocationDomain.DisplayOrder).Underscore());

        builder.Property(l => l.ParentId).HasColumnName(nameof(LocationDomain.ParentId).Underscore());

        builder.Property<int>(LocationTypeId).HasColumnName(nameof(LocationTypeId).Underscore()).IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<LocationDomain> builder)
    {
        builder.HasOne(l => l.LocationType).WithMany().HasForeignKey(LocationTypeId).IsRequired();

        builder.HasMany(l => l.Cities).WithOne().HasForeignKey(l => l.ParentId);

        var citiesNavigationProperty = builder.Metadata.FindNavigation(nameof(LocationDomain.Cities));
        citiesNavigationProperty?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<LocationDomain> builder)
    {
        builder.HasIndex(l => l.Code);
        builder.HasIndex(l => l.ParentId);
    }

    #endregion
}
