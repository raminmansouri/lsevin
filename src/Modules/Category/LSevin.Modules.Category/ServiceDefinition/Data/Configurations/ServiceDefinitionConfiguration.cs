using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Data.Configurations;

internal sealed class ServiceDefinitionConfiguration
    : EntityConfigConfigurationContracts<ServiceDefinitionDomain>,
        IEntityTypeConfiguration<ServiceDefinitionDomain>
{
    public void Configure(EntityTypeBuilder<ServiceDefinitionDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ServiceDefinitionDomain> builder)
    {
        builder.ConfigureEntity<ServiceDefinitionDomain, ServiceDefinitionId>(
            nameof(ServiceDefinition),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(sd => sd.Name)
            .ConfigureLocalizedStringNonNullable<ServiceDefinitionDomain>(
                nameof(ServiceDefinitionDomain.Name).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ServiceDefinitionNameMaxLength * 10
            );

        builder
            .Property(sd => sd.Description)
            .ConfigureLocalizedStringNonNullable<ServiceDefinitionDomain>(
                nameof(ServiceDefinitionDomain.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ServiceDefinitionDescriptionMaxLength * 10
            );

        builder
            .Property(sd => sd.CategoryId)
            .HasColumnName(nameof(ServiceDefinitionDomain.CategoryId).Underscore())
            .IsRequired();

        builder
            .Property(sd => sd.DurationMinutes)
            .HasColumnName(nameof(ServiceDefinitionDomain.DurationMinutes).Underscore())
            .IsRequired();

        builder.ComplexProperty(sd => sd.BasePrice).Configure();

        builder
            .Property(sd => sd.PricingModel)
            .HasMaxLength(DomainConstValues.ServicePricingModelMaxLength)
            .HasColumnName(nameof(ServiceDefinitionDomain.PricingModel).Underscore())
            .IsRequired();

        builder
            .Property(sd => sd.IsActive)
            .HasColumnName(nameof(ServiceDefinitionDomain.IsActive).Underscore())
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ServiceDefinitionDomain> builder)
    {
        builder
            .HasOne<CategoryDomain>()
            .WithMany()
            .IsRequired()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.OwnsMany(
            sd => sd.Requirements,
            req =>
            {
                req.ToTable(
                    $"{nameof(ServiceDefinitionDomain)}{nameof(ServiceDefinitionDomain.Requirements)}"
                        .Pluralize()
                        .Underscore(),
                    CategoryContext.DefaultSchema
                );
                req.WithOwner().HasForeignKey(nameof(ServiceDefinitionId));
                req.Configure();
            }
        );

        builder
            .HasMany(b => b.AttributeDefinitions)
            .WithOne()
            .HasForeignKey(nameof(ServiceDefinitionId))
            .OnDelete(DeleteBehavior.Cascade);

        var attributeDefinitionsNavigation = builder.Metadata.FindNavigation(
            nameof(ServiceDefinitionDomain.AttributeDefinitions)
        );
        attributeDefinitionsNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<ServiceDefinitionDomain> builder) { }

    #endregion
}
