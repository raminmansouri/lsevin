using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.SharedKernel.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.SharedKernel.Data.Configurations;

internal sealed class AttributeTypeConfiguration
    : EntityConfigConfigurationContracts<AttributeType>,
        IEntityTypeConfiguration<AttributeType>
{
    public void Configure(EntityTypeBuilder<AttributeType> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<AttributeType> builder)
    {
        builder.ConfigureEnumeration(
            nameof(CategoryContext.AttributeTypes).Underscore(),
            CategoryContext.DefaultSchema
        );
    }

    public override void ConfigRelationships(EntityTypeBuilder<AttributeType> builder) { }

    public override void ConfigIndexes(EntityTypeBuilder<AttributeType> builder) { }

    #endregion
}
