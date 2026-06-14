using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceDefinition.Entities;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceDefinition.Data.Configurations;

internal sealed class ServiceAttributeDefinitionConfiguration
    : EntityConfigConfigurationContracts<ServiceAttributeDefinition>,
        IEntityTypeConfiguration<ServiceAttributeDefinition>
{
    private const string AttributeTypeId = "_attributeTypeId";

    public void Configure(EntityTypeBuilder<ServiceAttributeDefinition> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ServiceAttributeDefinition> builder)
    {
        builder.ConfigureEntity<ServiceAttributeDefinition, ServiceAttributeDefinitionId>(
            nameof(ServiceAttributeDefinition),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(sad => sad.Name)
            .ConfigureLocalizedStringNonNullable<ServiceAttributeDefinition>(
                nameof(ServiceAttributeDefinition.Name).Underscore() + EfConstants.LocalizedTablePostfix
            // DomainConstValues.ServiceAttributeNameMaxLength * 10
            );

        builder
            .Property(sad => sad.Description)
            .ConfigureLocalizedStringNonNullable<ServiceAttributeDefinition>(
                nameof(ServiceAttributeDefinition.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // DomainConstValues.ServiceAttributeDescriptionMaxLength * 10
            );

        builder.Property<int>(AttributeTypeId).HasColumnName(nameof(AttributeTypeId).Underscore()).IsRequired();

        builder
            .Property(sad => sad.IsRequired)
            .HasColumnName(nameof(ServiceAttributeDefinition.IsRequired).Underscore())
            .IsRequired();

        builder
            .Property(sad => sad.AffectsPricing)
            .HasColumnName(nameof(ServiceAttributeDefinition.AffectsPricing).Underscore())
            .IsRequired();

        builder
            .Property(sad => sad.DisplayOrder)
            .HasColumnName(nameof(ServiceAttributeDefinition.DisplayOrder).Underscore())
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ServiceAttributeDefinition> builder)
    {
        builder.HasOne(b => b.AttributeType).WithMany().HasForeignKey(AttributeTypeId).IsRequired();

        builder.OwnsMany(
            sad => sad.Options,
            opt =>
            {
                opt.ToTable(
                    $"{nameof(ServiceAttributeDefinition)}{nameof(ServiceAttributeDefinition.Options)}"
                        .Pluralize()
                        .Underscore(),
                    CategoryContext.DefaultSchema
                );
                opt.WithOwner().HasForeignKey(nameof(ServiceAttributeDefinitionId));
                opt.Configure();
            }
        );
    }

    public override void ConfigIndexes(EntityTypeBuilder<ServiceAttributeDefinition> builder) { }

    #endregion
}
