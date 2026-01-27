using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Identity.Identity.Data.EntityConfigurations;

internal sealed class PhoneLoginCodeConfiguration
    : EntityConfigConfigurationContracts<PhoneLoginCode>,
        IEntityTypeConfiguration<PhoneLoginCode>
{
    public void Configure(EntityTypeBuilder<PhoneLoginCode> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<PhoneLoginCode> builder)
    {
        builder.ToTable(nameof(PhoneLoginCode).Pluralize().Underscore());

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).HasColumnName(nameof(PhoneLoginCode.UserId).Underscore()).IsRequired();

        builder.ComplexProperty(x => x.PhoneNumber).Configure();

        builder
            .Property(x => x.Code)
            .HasColumnName(nameof(PhoneLoginCode.Code).Underscore())
            .HasMaxLength(DomainConstValues.PhoneLoginCodeMaxLength)
            .IsFixedLength()
            .IsRequired();

        builder.Property(x => x.SentAt).HasColumnName(nameof(PhoneLoginCode.SentAt).Underscore()).IsRequired();
        builder.Property(x => x.SentAt).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);

        builder.Property(x => x.UsedAt).HasColumnName(nameof(PhoneLoginCode.UsedAt).Underscore()).IsRequired(false);
        builder.Property(x => x.UsedAt).Metadata.SetBeforeSaveBehavior(PropertySaveBehavior.Throw);

        builder.Property(x => x.ExpiresAt).HasColumnName(nameof(PhoneLoginCode.ExpiresAt).Underscore()).IsRequired();

        builder
            .Property(x => x.AttemptCount)
            .HasColumnName(nameof(PhoneLoginCode.AttemptCount).Underscore())
            .HasDefaultValue(0)
            .IsRequired();

        builder
            .Property(x => x.IsInvalidated)
            .HasColumnName(nameof(PhoneLoginCode.IsInvalidated).Underscore())
            .HasDefaultValue(false)
            .IsRequired();
    }

    public override void ConfigRelationships(EntityTypeBuilder<PhoneLoginCode> builder)
    {
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }

    public override void ConfigIndexes(EntityTypeBuilder<PhoneLoginCode> builder)
    {
        builder.HasIndex(x => x.UserId);

        builder.HasIndex(x => new
        {
            x.UserId,
            x.IsInvalidated,
            x.ExpiresAt,
        });

        builder.HasIndex(x => x.ExpiresAt);
    }
}
