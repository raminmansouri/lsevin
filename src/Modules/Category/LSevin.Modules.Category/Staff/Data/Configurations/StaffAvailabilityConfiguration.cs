using BuildingBlocks.Core.Domain.ValueObjects;
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

internal sealed class StaffAvailabilityConfiguration
    : EntityConfigConfigurationContracts<StaffAvailability>,
        IEntityTypeConfiguration<StaffAvailability>
{
    private const string AvailabilityStatusId = "_statusId";

    public void Configure(EntityTypeBuilder<StaffAvailability> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<StaffAvailability> builder)
    {
        builder.ConfigureEntity<StaffAvailability, StaffAvailabilityId>(
            nameof(StaffAvailability),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(sa => sa.DayOfWeek)
            .HasColumnName(nameof(StaffAvailability.DayOfWeek).Underscore())
            .IsRequired();

        builder.ComplexProperty(sa => sa.TimeRange).Configure();

        builder
            .Property(sa => sa.IsRecurring)
            .HasColumnName(nameof(StaffAvailability.IsRecurring).Underscore())
            .IsRequired();

        builder.Property(sa => sa.SpecificDate).HasColumnName(nameof(StaffAvailability.SpecificDate).Underscore());

        builder.Property(nameof(StaffId)).HasColumnName(nameof(StaffId).Underscore()).IsRequired();

        builder
            .Property<int>(AvailabilityStatusId)
            .HasColumnName(nameof(AvailabilityStatusId).Underscore())
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<StaffAvailability> builder)
    {
        builder.HasOne(sa => sa.Status).WithMany().HasForeignKey(AvailabilityStatusId);
    }

    public override void ConfigIndexes(EntityTypeBuilder<StaffAvailability> builder)
    {
        // Create index on StaffId to quickly find availability for a staff member
        builder.HasIndex(nameof(StaffId));

        // Create compound index on staff id and day of week for faster lookups of availability by day
        builder.HasIndex([nameof(StaffId), nameof(StaffAvailability.DayOfWeek)]);
    }

    #endregion
}
