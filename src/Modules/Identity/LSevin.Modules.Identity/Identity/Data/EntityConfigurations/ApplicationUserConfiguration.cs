using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Persistence;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Types;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Identity.Identity.Data.EntityConfigurations;

internal sealed class ApplicationUserConfiguration
    : EntityConfigConfigurationContracts<ApplicationUser>,
        IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(x => x.FirstName).HasMaxLength(GlobalDomainConstValues.FirstNameMaxLength).IsRequired();

        builder.Property(x => x.LastName).HasMaxLength(GlobalDomainConstValues.LastNameMaxLength).IsRequired();

        builder.Property(x => x.UserName).HasMaxLength(DomainConstValues.ApplicationUserNameMaxLength).IsRequired();

        builder
            .Property(x => x.NormalizedUserName)
            .HasMaxLength(DomainConstValues.ApplicationUserNameNormalizedNameMaxLength)
            .IsRequired();

        builder.Property(x => x.Email).HasMaxLength(GlobalDomainConstValues.EmailMaxLength).IsRequired();

        builder.Property(x => x.NormalizedEmail).HasMaxLength(GlobalDomainConstValues.EmailMaxLength).IsRequired();

        builder
            .Property(x => x.PhoneNumberCountryCode)
            .HasMaxLength(GlobalDomainConstValues.PhoneCountryCodeMaxLength)
            .IsRequired();

        builder.Property(x => x.PhoneNumber).HasMaxLength(GlobalDomainConstValues.PhoneNumberMaxLength).IsRequired();

        builder.Property(x => x.CreatedAt).HasDefaultValueSql(EfConstants.DateAlgorithm);

        builder
            .Property(x => x.UserState)
            .HasDefaultValue(UserState.Active)
            .IsRequired()
            .HasConversion(x => x.ToString(), x => Enum.Parse<UserState>(x));
    }

    public override void ConfigRelationships(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.HasMany(e => e.UserRoles).WithOne(e => e.User).HasForeignKey(ur => ur.UserId).IsRequired();
    }

    public override void ConfigIndexes(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasIndex(x => x.NormalizedEmail).IsUnique();
        builder.HasIndex(x => new { x.PhoneNumberCountryCode, x.PhoneNumber }).IsUnique();
    }
}
