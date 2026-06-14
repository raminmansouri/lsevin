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

namespace LSevin.Modules.Category.ServiceProvider.Data.Configurations;

internal sealed class ServiceAttributeValueConfiguration
    : EntityConfigConfigurationContracts<ServiceAttributeValue>,
        IEntityTypeConfiguration<ServiceAttributeValue>
{
    public void Configure(EntityTypeBuilder<ServiceAttributeValue> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ServiceAttributeValue> builder)
    {
        builder.ConfigureEntity<ServiceAttributeValue, ServiceAttributeValueId>(
            nameof(ServiceAttributeValue).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder.Property(nameof(ProviderServiceId)).HasColumnName(nameof(ProviderServiceId).Underscore()).IsRequired();

        builder
            .Property(sav => sav.Value)
            .ConfigureLocalizedStringNonNullable<ServiceAttributeValue>(
                nameof(ServiceAttributeValue.Value).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.AttributeValueMaxLength * 10
            );

        builder
            .Property(sav => sav.AttributeDefinitionId)
            .HasColumnName(nameof(ServiceAttributeValue.AttributeDefinitionId).Underscore())
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ServiceAttributeValue> builder)
    {
        // No relation because its from another aggregate's entities and here is not aggregate root
        // builder.HasOne<ServiceAttributeDefinition>()
        //     .WithMany()
        //     .HasForeignKey(sav => sav.AttributeDefinitionId)
        //     .OnDelete(DeleteBehavior.NoAction);
    }

    public override void ConfigIndexes(EntityTypeBuilder<ServiceAttributeValue> builder)
    {
        builder.HasIndex(sav => sav.AttributeDefinitionId);

        // Ensure uniqueness of service-attributeDefinition combination
        builder.HasIndex([nameof(ProviderServiceId), nameof(ServiceAttributeValue.AttributeDefinitionId)]).IsUnique();
    }

    #endregion
}
