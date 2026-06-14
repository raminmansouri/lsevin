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
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Data.Configurations;

internal sealed class CategoryConfiguration
    : EntityConfigConfigurationContracts<CategoryDomain>,
        IEntityTypeConfiguration<CategoryDomain>
{
    public void Configure(EntityTypeBuilder<CategoryDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<CategoryDomain> builder)
    {
        builder.ConfigureEntity<CategoryDomain, CategoryId>(nameof(Category), CategoryContext.DefaultSchema);

        builder
            .Property(x => x.Name)
            .ConfigureLocalizedStringNonNullable<CategoryDomain>(
                nameof(CategoryDomain.Name).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.CategoryNameMaxLength * 10
            );

        builder
            .Property(x => x.Description)
            .ConfigureLocalizedStringNonNullable<CategoryDomain>(
                nameof(CategoryDomain.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.CategoryDescriptionMaxLength * 10
            );

        builder.Property(x => x.DisplayOrder).IsRequired().HasDefaultValue(0);

        builder.Property(x => x.IsActive).IsRequired();

        builder.Property(x => x.IconUrl).HasMaxLength(DomainConstValues.CategoryIconUrlMaxLength).IsRequired(false);

        builder.Property(b => b.ParentId).HasColumnName(nameof(CategoryDomain.ParentId).Underscore()).IsRequired(false);
    }

    public override void ConfigRelationships(EntityTypeBuilder<CategoryDomain> builder)
    {
        builder.HasMany(pg => pg.Children).WithOne().HasForeignKey(b => b.ParentId).OnDelete(DeleteBehavior.NoAction);
        var navigationChildren = builder.Metadata.FindNavigation(nameof(CategoryDomain.Children));
        navigationChildren?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<CategoryDomain> builder) { }
}
