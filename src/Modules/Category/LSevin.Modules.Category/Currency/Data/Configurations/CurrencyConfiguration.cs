using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CategoryDomain = LSevin.Modules.Category.Currency.Entities.Currency;

namespace LSevin.Modules.Category.Category.Data.Configurations;

internal sealed class CurrencyConfiguration
    : EntityConfigConfigurationContracts<CategoryDomain>,
        IEntityTypeConfiguration<CategoryDomain>
{
    public void Configure(EntityTypeBuilder<CategoryDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<CategoryDomain> builder)
    {
        builder.ConfigureEntity<CategoryDomain, CurrencyId>("currencies", CategoryContext.DefaultSchema);

        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.Symbol).IsRequired();
        builder.Property(x => x.Price).IsRequired();

    }



    public override void ConfigIndexes(EntityTypeBuilder<CategoryDomain> builder) { }
}
