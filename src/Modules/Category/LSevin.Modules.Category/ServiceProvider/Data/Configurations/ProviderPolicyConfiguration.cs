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

internal sealed class ProviderPolicyConfiguration
    : EntityConfigConfigurationContracts<ProviderPolicy>,
        IEntityTypeConfiguration<ProviderPolicy>
{
    public void Configure(EntityTypeBuilder<ProviderPolicy> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ProviderPolicy> builder)
    {
        builder.ConfigureEntity<ProviderPolicy, ProviderPolicyId>(
            nameof(ProviderPolicy).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder.Property(nameof(ServiceProviderId)).HasColumnName(nameof(ServiceProviderId).Underscore()).IsRequired();

        builder
            .Property(pp => pp.Type)
            .ConfigureLocalizedStringNonNullable<ProviderPolicy>(
                nameof(ProviderPolicy.Type).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: 50 * 10
            );

        builder
            .Property(pp => pp.Description)
            .ConfigureLocalizedStringNonNullable<ProviderPolicy>(
                nameof(ProviderPolicy.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.PolicyDescriptionMaxLength * 10
            );
    }

    public override void ConfigRelationships(EntityTypeBuilder<ProviderPolicy> builder)
    {
        // The relationships are defined in the ServiceProviderConfiguration
    }

    public override void ConfigIndexes(EntityTypeBuilder<ProviderPolicy> builder)
    {
        builder.HasIndex(pp => pp.Type);

        // Ensure uniqueness of provider-policyType combination
        builder.HasIndex([nameof(ServiceProviderId), nameof(ProviderPolicy.Type)]).IsUnique();
    }

    #endregion
}
