using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceRequest.Entities;
using LSevin.Modules.Category.ServiceRequest.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceRequest.Data.Configurations;

internal sealed class ServiceProviderRequestConfiguration
    : EntityConfigConfigurationContracts<ServiceProviderRequest>,
        IEntityTypeConfiguration<ServiceProviderRequest>
{
    private const string RequestStatusId = "_requestStatusId";

    public void Configure(EntityTypeBuilder<ServiceProviderRequest> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<ServiceProviderRequest> builder)
    {
        builder.ConfigureEntity<ServiceProviderRequest, ServiceProviderRequestId>(
            nameof(ServiceProviderRequest).Pluralize(),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(sp => sp.ServiceProviderId)
            .HasColumnName(nameof(ServiceProviderRequest.ServiceProviderId).Underscore())
            .IsRequired();

        builder
            .Property(sp => sp.CustomerId)
            .HasColumnName(nameof(ServiceProviderRequest.CustomerId).Underscore())
            .IsRequired();

        builder
            .Property(sp => sp.CustomerEmail)
            .HasColumnName(nameof(ServiceProviderRequest.CustomerEmail).Underscore())
            .HasMaxLength(256)
            .IsRequired();

        builder
            .Property(sp => sp.CustomerFullName)
            .HasColumnName(nameof(ServiceProviderRequest.CustomerFullName).Underscore())
            .HasMaxLength(256)
            .IsRequired();

        builder
            .Property(sp => sp.Message)
            .HasColumnName(nameof(ServiceProviderRequest.Message).Underscore())
            .HasMaxLength(DomainConstValues.ServiceProviderRequestMessageMaxLength)
            .IsRequired();

        builder.Property<int>(RequestStatusId).HasColumnName(nameof(RequestStatusId).Underscore()).IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<ServiceProviderRequest> builder)
    {
        builder.HasOne(sa => sa.RequestStatus).WithMany().HasForeignKey(RequestStatusId);

        builder
            .HasOne<ServiceProvider.Entities.ServiceProvider>()
            .WithMany()
            .HasForeignKey(sp => sp.ServiceProviderId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public override void ConfigIndexes(EntityTypeBuilder<ServiceProviderRequest> builder)
    {
        builder.HasIndex(sp => sp.ServiceProviderId);
        builder.HasIndex(sp => sp.CustomerId);
    }

    #endregion
}
