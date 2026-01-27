using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.Staff.Entities;
using LSevin.Modules.Category.Staff.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.Staff.Data.Configurations;

internal sealed class StaffServiceConfiguration
    : EntityConfigConfigurationContracts<StaffService>,
        IEntityTypeConfiguration<StaffService>
{
    public void Configure(EntityTypeBuilder<StaffService> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<StaffService> builder)
    {
        builder.ConfigureEntity<StaffService, StaffServiceId>(nameof(StaffService), CategoryContext.DefaultSchema);

        builder.Property(nameof(StaffId)).HasColumnName(nameof(StaffId).Underscore()).IsRequired();

        builder
            .Property(ss => ss.ServiceDefinitionId)
            .HasColumnName(nameof(StaffService.ServiceDefinitionId).Underscore())
            .IsRequired();

        builder.Property(ss => ss.IsActive).HasColumnName(nameof(StaffService.IsActive).Underscore()).IsRequired();

        builder
            .Property(ss => ss.Notes)
            .ConfigureLocalizedStringNonNullable<StaffService>(
                nameof(StaffService.Notes).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: 2000 * 10
            );
    }

    public override void ConfigRelationships(EntityTypeBuilder<StaffService> builder) { }

    public override void ConfigIndexes(EntityTypeBuilder<StaffService> builder)
    {
        builder.HasIndex(nameof(StaffId));

        builder.HasIndex([nameof(StaffId), nameof(StaffService.ServiceDefinitionId)]).IsUnique();
    }

    #endregion
}
