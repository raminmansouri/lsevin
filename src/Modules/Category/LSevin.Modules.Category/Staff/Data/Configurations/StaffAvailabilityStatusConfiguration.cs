using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.Staff.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.Staff.Data.Configurations;

internal sealed class StaffAvailabilityStatusConfiguration
    : EntityConfigConfigurationContracts<StaffAvailabilityStatus>,
        IEntityTypeConfiguration<StaffAvailabilityStatus>
{
    public void Configure(EntityTypeBuilder<StaffAvailabilityStatus> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<StaffAvailabilityStatus> builder)
    {
        builder.ConfigureEnumeration(
            nameof(StaffAvailabilityStatus).Pluralize().Underscore(),
            CategoryContext.DefaultSchema
        );
    }

    public override void ConfigRelationships(EntityTypeBuilder<StaffAvailabilityStatus> builder) { }

    public override void ConfigIndexes(EntityTypeBuilder<StaffAvailabilityStatus> builder) { }

    #endregion
}
