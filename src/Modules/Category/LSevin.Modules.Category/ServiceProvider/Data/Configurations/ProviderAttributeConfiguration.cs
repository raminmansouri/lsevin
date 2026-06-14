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

internal sealed class ProviderAttributeConfiguration
    : EntityConfigConfigurationContracts<ProviderAttribute>,
        IEntityTypeConfiguration<ProviderAttribute>
{
    public void Configure(EntityTypeBuilder<ProviderAttribute> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ProviderAttribute> builder)
    {
        builder.ConfigureEntity<ProviderAttribute, ProviderAttributeId>(
            nameof(ProviderAttribute).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder.Property(nameof(ServiceProviderId)).HasColumnName(nameof(ServiceProviderId).Underscore()).IsRequired();

        builder
            .Property(pa => pa.Value)
            .ConfigureLocalizedStringNonNullable<ProviderAttribute>(
                nameof(ProviderAttribute.Value).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.AttributeValueMaxLength * 10
            );

        builder
            .Property(pa => pa.AttributeDefinitionId)
            .HasColumnName(nameof(ProviderAttribute.AttributeDefinitionId).Underscore())
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ProviderAttribute> builder)
    {
        // There is no relation because it's from another aggregate's entity, and here is not aggregate root
        // builder.HasOne<ProviderAttributeDefinition>()
        //     .WithMany()
        //     .HasForeignKey(pa => pa.AttributeDefinitionId)
        //     .OnDelete(DeleteBehavior.NoAction);
    }

    public override void ConfigIndexes(EntityTypeBuilder<ProviderAttribute> builder)
    {
        builder.HasIndex(pa => pa.AttributeDefinitionId);

        // Ensure uniqueness of provider-attributeDefinition combination
        builder.HasIndex(nameof(ServiceProviderId), nameof(ProviderAttribute.AttributeDefinitionId)).IsUnique();
    }

    #endregion
}
