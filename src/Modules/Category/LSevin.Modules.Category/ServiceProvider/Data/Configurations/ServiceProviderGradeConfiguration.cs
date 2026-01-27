using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceProvider.Data.Configurations;

internal sealed class ServiceProviderGradeConfiguration
    : EntityConfigConfigurationContracts<ServiceProviderGrade>,
        IEntityTypeConfiguration<ServiceProviderGrade>
{
    public void Configure(EntityTypeBuilder<ServiceProviderGrade> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ServiceProviderGrade> builder)
    {
        builder.ConfigureEnumeration(
            nameof(ServiceProviderGrade).Pluralize().Underscore(),
            CategoryContext.DefaultSchema
        );
    }

    public override void ConfigRelationships(EntityTypeBuilder<ServiceProviderGrade> builder) { }

    public override void ConfigIndexes(EntityTypeBuilder<ServiceProviderGrade> builder) { }

    #endregion
}
