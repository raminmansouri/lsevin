using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.Staff.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffDomain = LSevin.Modules.Category.Staff.Entities.Staff;

namespace LSevin.Modules.Category.Staff.Data.Configurations;

internal sealed class StaffConfiguration
    : EntityConfigConfigurationContracts<StaffDomain>,
        IEntityTypeConfiguration<StaffDomain>
{
    public void Configure(EntityTypeBuilder<StaffDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<StaffDomain> builder)
    {
        builder.ConfigureEntity<StaffDomain, StaffId>(nameof(Staff), CategoryContext.DefaultSchema);

        builder
            .Property(s => s.Name)
            .ConfigureLocalizedStringNonNullable<StaffDomain>(
                nameof(StaffDomain.Name).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.StaffNameMaxLength * 10
            );

        builder
            .Property(s => s.Biography)
            .ConfigureLocalizedStringNonNullable<StaffDomain>(
                nameof(StaffDomain.Biography).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.StaffBiographyMaxLength * 10
            );

        builder
            .Property(s => s.Title)
            .ConfigureLocalizedStringNonNullable<StaffDomain>(
                nameof(StaffDomain.Title).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.StaffTitleMaxLength * 10
            );

        builder
            .Property(s => s.ProfileImageUrl)
            .HasMaxLength(DomainConstValues.StaffProfileImageUrlMaxLength)
            .HasColumnName(nameof(StaffDomain.ProfileImageUrl).Underscore());

        builder.Property(s => s.IsActive).HasColumnName(nameof(StaffDomain.IsActive).Underscore()).IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<StaffDomain> builder)
    {
        builder.HasMany(s => s.Services).WithOne().HasForeignKey(nameof(StaffId)).OnDelete(DeleteBehavior.Cascade);
        var staffServiceNavigationProperty = builder.Metadata.FindNavigation(nameof(StaffDomain.Services));
        staffServiceNavigationProperty?.SetPropertyAccessMode(PropertyAccessMode.Field);

        builder
            .HasMany(s => s.Availabilities)
            .WithOne()
            .HasForeignKey(nameof(StaffId))
            .OnDelete(DeleteBehavior.Cascade);
        var staffAvailabilityNavigationProperty = builder.Metadata.FindNavigation(nameof(StaffDomain.Availabilities));
        staffAvailabilityNavigationProperty?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<StaffDomain> builder) { }

    #endregion
}
