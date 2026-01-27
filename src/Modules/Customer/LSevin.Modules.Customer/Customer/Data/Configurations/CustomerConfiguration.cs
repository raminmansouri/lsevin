using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Customer.Customer.ValueObjects;
using LSevin.Modules.Customer.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CustomerDomain = LSevin.Modules.Customer.Customer.Entities.Customer;

namespace LSevin.Modules.Customer.Customer.Data.Configurations;

internal sealed class CustomerConfiguration
    : EntityConfigConfigurationContracts<CustomerDomain>,
        IEntityTypeConfiguration<CustomerDomain>
{
    public void Configure(EntityTypeBuilder<CustomerDomain> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<CustomerDomain> builder)
    {
        builder.ConfigureEntity<CustomerDomain, CustomerId>(nameof(Customer), CustomerContext.DefaultSchema);

        builder.ComplexProperty(p => p.FirstName).Configure();
        builder.ComplexProperty(p => p.LastName).Configure();
        builder.OwnsOne(p => p.BirthDate).Configure();

        builder.OwnsOne(
            p => p.Email,
            c =>
            {
                c.Configure();
                c.HasIndex(i => i.Value).IsUnique();
            }
        );

        builder.OwnsOne(
            p => p.PhoneNumber,
            c =>
            {
                c.Configure();
                c.HasIndex(i => new { i.Value, i.CountryCode }).IsUnique();
            }
        );

        builder.OwnsOne(p => p.Address).Configure();

        builder.Property(x => x.Gender).ConfigureNullableEnumProperty(columnName: nameof(CustomerDomain.Gender));

        builder
            .Property(x => x.IsActive)
            .IsRequired()
            .HasColumnName(nameof(CustomerDomain.IsActive).Underscore())
            .HasDefaultValue(true);
    }

    public override void ConfigRelationships(EntityTypeBuilder<CustomerDomain> builder)
    {
        builder.HasMany(b => b.Documents).WithOne().HasForeignKey(nameof(CustomerId)).OnDelete(DeleteBehavior.Cascade);

        var navigationDocuments = builder.Metadata.FindNavigation(nameof(CustomerDomain.Documents));
        navigationDocuments?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }

    public override void ConfigIndexes(EntityTypeBuilder<CustomerDomain> builder) { }

    #endregion
}
