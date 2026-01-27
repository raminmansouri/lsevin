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
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceProvider.Data.Configurations;

internal sealed class ProviderServiceConfiguration
    : EntityConfigConfigurationContracts<ProviderService>,
        IEntityTypeConfiguration<ProviderService>
{
    public void Configure(EntityTypeBuilder<ProviderService> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ProviderService> builder)
    {
        builder.ConfigureEntity<ProviderService, ProviderServiceId>(
            nameof(ProviderService).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder.Property(nameof(ServiceProviderId)).HasColumnName(nameof(ServiceProviderId).Underscore()).IsRequired();

        builder
            .Property(ps => ps.DisplayName)
            .ConfigureLocalizedStringNonNullable<ProviderService>(
                nameof(ProviderService.DisplayName).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ProviderServiceNameMaxLength * 10
            );

        builder
            .Property(ps => ps.Description)
            .ConfigureLocalizedStringNonNullable<ProviderService>(
                nameof(ProviderService.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ProviderServiceDescriptionMaxLength * 10
            );

        builder.ComplexProperty(ps => ps.Price).Configure();

        builder
            .Property(ps => ps.DurationMinutes)
            .HasColumnName(nameof(ProviderService.DurationMinutes).Underscore())
            .IsRequired();

        builder.Property(ps => ps.IsActive).HasColumnName(nameof(ProviderService.IsActive).Underscore()).IsRequired();

        builder
            .Property(ps => ps.ServiceDefinitionId)
            .HasColumnName(nameof(ProviderService.ServiceDefinitionId).Underscore())
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ProviderService> builder)
    {
        builder
            .HasOne<ServiceDefinitionDomain>()
            .WithMany()
            .HasForeignKey(ps => ps.ServiceDefinitionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder
            .HasMany(ps => ps.AttributeValues)
            .WithOne()
            .HasForeignKey(nameof(ProviderServiceId))
            .OnDelete(DeleteBehavior.Cascade);
        var attributeValuesNavigation = builder.Metadata.FindNavigation(nameof(ProviderService.AttributeValues));
        attributeValuesNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<ProviderService> builder)
    {
        builder.HasIndex(ps => ps.ServiceDefinitionId);
        builder.HasIndex(ps => ps.IsActive);

        // Ensure uniqueness of provider-serviceDefinition combination
        builder.HasIndex([nameof(ServiceProviderId), nameof(ProviderService.ServiceDefinitionId)]).IsUnique();
    }

    #endregion
}
