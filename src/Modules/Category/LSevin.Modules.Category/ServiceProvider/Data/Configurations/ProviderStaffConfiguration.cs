using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffDomain = LSevin.Modules.Category.Staff.Entities.Staff;

namespace LSevin.Modules.Category.ServiceProvider.Data.Configurations;

internal sealed class ProviderStaffConfiguration
    : EntityConfigConfigurationContracts<ProviderStaff>,
        IEntityTypeConfiguration<ProviderStaff>
{
    public void Configure(EntityTypeBuilder<ProviderStaff> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ProviderStaff> builder)
    {
        builder.ConfigureEntity<ProviderStaff, ProviderStaffId>(
            nameof(ProviderStaff).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder.Property(nameof(ServiceProviderId)).HasColumnName(nameof(ServiceProviderId).Underscore()).IsRequired();

        builder
            .Property(ps => ps.Notes)
            .ConfigureLocalizedStringNonNullable<ProviderStaff>(
                nameof(ProviderStaff.Notes).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.NotesMaxLength * 10
            );

        builder.Property(ps => ps.IsActive).HasColumnName(nameof(ProviderStaff.IsActive).Underscore()).IsRequired();

        builder.Property(ps => ps.StaffId).HasColumnName(nameof(ProviderStaff.StaffId).Underscore()).IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ProviderStaff> builder)
    {
        builder.HasOne<StaffDomain>().WithMany().HasForeignKey(ps => ps.StaffId).OnDelete(DeleteBehavior.NoAction);
    }

    public override void ConfigIndexes(EntityTypeBuilder<ProviderStaff> builder)
    {
        builder.HasIndex(ps => ps.StaffId);
        builder.HasIndex(ps => ps.IsActive);

        // Ensure uniqueness of provider-staff combination
        builder.HasIndex([nameof(ServiceProviderId), nameof(ProviderStaff.StaffId)]).IsUnique();
    }

    #endregion
}
