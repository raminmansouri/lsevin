using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceRequest.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceRequest.Data.Configurations;

internal sealed class RequestStatusConfiguration
    : EntityConfigConfigurationContracts<ServiceProviderRequestStatus>,
        IEntityTypeConfiguration<ServiceProviderRequestStatus>
{
    public void Configure(EntityTypeBuilder<ServiceProviderRequestStatus> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ServiceProviderRequestStatus> builder)
    {
        builder.ConfigureEnumeration(
            nameof(ServiceProviderRequestStatus).Pluralize().Underscore(),
            CategoryContext.DefaultSchema
        );
    }

    public override void ConfigRelationships(EntityTypeBuilder<ServiceProviderRequestStatus> builder) { }

    public override void ConfigIndexes(EntityTypeBuilder<ServiceProviderRequestStatus> builder) { }

    #endregion
}
