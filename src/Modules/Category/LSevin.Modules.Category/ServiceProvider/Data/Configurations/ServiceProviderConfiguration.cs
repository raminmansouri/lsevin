using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ServiceProvider.Data.Configurations;

internal sealed class ServiceProviderConfiguration
    : EntityConfigConfigurationContracts<Entities.ServiceProvider>,
        IEntityTypeConfiguration<Entities.ServiceProvider>
{
    private const string GradeId = "_gradeId";

    public void Configure(EntityTypeBuilder<Entities.ServiceProvider> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<Entities.ServiceProvider> builder)
    {
        builder.ConfigureEntity<Entities.ServiceProvider, ServiceProviderId>(
            nameof(Entities.ServiceProvider),
            CategoryContext.DefaultSchema
        );

        builder
            .Property(sp => sp.Name)
            .ConfigureLocalizedStringNonNullable<Entities.ServiceProvider>(
                nameof(Entities.ServiceProvider.Name).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ServiceProviderNameMaxLength * 10
            );

        builder
            .Property(sp => sp.Description)
            .ConfigureLocalizedStringNonNullable<Entities.ServiceProvider>(
                nameof(Entities.ServiceProvider.Description).Underscore() + EfConstants.LocalizedTablePostfix
            // maxLength: DomainConstValues.ServiceProviderDescriptionMaxLength * 10
            );

        builder.ComplexProperty(sp => sp.ContactEmail).Configure();

        builder.ComplexProperty(sp => sp.ContactPhone).Configure();

        builder.OwnsOne(sp => sp.Address).Configure();

        builder
            .Property(sp => sp.IsActive)
            .HasColumnName(nameof(Entities.ServiceProvider.IsActive).Underscore())
            .IsRequired();

        builder
            .Property(sp => sp.ProviderTypeId)
            .HasColumnName(nameof(Entities.ServiceProvider.ProviderTypeId).Underscore())
            .IsRequired();

        builder.Property<int?>(GradeId).HasColumnName(nameof(GradeId).Underscore()).IsRequired(false);

        // shadow properties
        builder
            .Property<string>($"{nameof(Address)}{nameof(Address.Country)}")
            .HasColumnName(nameof(Address.Country).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();

        builder
            .Property<string>($"{nameof(Address)}{nameof(Address.City)}")
            .HasColumnName(nameof(Address.City).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<Entities.ServiceProvider> builder)
    {
        builder.HasOne(sp => sp.Grade).WithMany().HasForeignKey(GradeId);

        builder
            .HasOne<ProviderTypeDomain>()
            .WithMany()
            .IsRequired()
            .HasForeignKey(b => b.ProviderTypeId)
            .OnDelete(DeleteBehavior.NoAction);

        builder
            .HasMany(sp => sp.Attributes)
            .WithOne()
            .HasForeignKey(nameof(ServiceProviderId))
            .OnDelete(DeleteBehavior.Cascade);
        var attributesNavigation = builder.Metadata.FindNavigation(nameof(Entities.ServiceProvider.Attributes));
        attributesNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);

        builder
            .HasMany(sp => sp.Services)
            .WithOne()
            .HasForeignKey(nameof(ServiceProviderId))
            .OnDelete(DeleteBehavior.Cascade);
        var servicesNavigation = builder.Metadata.FindNavigation(nameof(Entities.ServiceProvider.Services));
        servicesNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);

        builder
            .HasMany(sp => sp.GalleryItems)
            .WithOne()
            .HasForeignKey(nameof(ServiceProviderId))
            .OnDelete(DeleteBehavior.Cascade);
        var galleryItemsNavigation = builder.Metadata.FindNavigation(nameof(Entities.ServiceProvider.GalleryItems));
        galleryItemsNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);

        builder
            .HasMany(sp => sp.Policies)
            .WithOne()
            .HasForeignKey(nameof(ServiceProviderId))
            .OnDelete(DeleteBehavior.Cascade);
        var policiesNavigation = builder.Metadata.FindNavigation(nameof(Entities.ServiceProvider.Policies));
        policiesNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);

        builder
            .HasMany(sp => sp.StaffMembers)
            .WithOne()
            .HasForeignKey(nameof(ServiceProviderId))
            .OnDelete(DeleteBehavior.Cascade);
        var staffMembersNavigation = builder.Metadata.FindNavigation(nameof(Entities.ServiceProvider.StaffMembers));
        staffMembersNavigation?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<Entities.ServiceProvider> builder)
    {
        builder.HasIndex(sp => sp.Name);
        builder.HasIndex(sp => sp.ProviderTypeId);
        builder.HasIndex(sp => sp.IsActive);
        builder.HasIndex(GradeId);
        builder.HasIndex(GradeId, nameof(Entities.ServiceProvider.ProviderTypeId));
        builder.HasIndex($"{nameof(Address)}{nameof(Address.Country)}", $"{nameof(Address)}{nameof(Address.City)}");
        builder.HasIndex(
            nameof(Entities.ServiceProvider.ProviderTypeId),
            $"{nameof(Address)}{nameof(Address.Country)}",
            $"{nameof(Address)}{nameof(Address.City)}"
        );
        builder.HasIndex(
            GradeId,
            nameof(Entities.ServiceProvider.ProviderTypeId),
            $"{nameof(Address)}{nameof(Address.Country)}",
            $"{nameof(Address)}{nameof(Address.City)}"
        );
    }

    #endregion
}
