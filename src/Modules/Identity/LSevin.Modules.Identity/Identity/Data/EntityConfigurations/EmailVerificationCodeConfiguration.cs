using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Identity.Identity.Data.EntityConfigurations;

internal sealed class EmailVerificationCodeConfiguration
    : EntityConfigConfigurationContracts<EmailVerificationCode>,
        IEntityTypeConfiguration<EmailVerificationCode>
{
    public void Configure(EntityTypeBuilder<EmailVerificationCode> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<EmailVerificationCode> builder)
    {
        builder.ToTable(nameof(EmailVerificationCode).Pluralize().Underscore());
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        builder.Property(x => x.Email).HasMaxLength(GlobalDomainConstValues.EmailMaxLength).IsRequired();

        builder
            .Property(x => x.Code)
            .HasMaxLength(DomainConstValues.EmailVerificationCodeMaxLength)
            .IsFixedLength()
            .IsRequired();

        builder.Property(x => x.SentAt).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
        builder.Property(x => x.UsedAt).Metadata.SetBeforeSaveBehavior(PropertySaveBehavior.Throw);
    }

    public override void ConfigRelationships(EntityTypeBuilder<EmailVerificationCode> builder) { }

    public override void ConfigIndexes(EntityTypeBuilder<EmailVerificationCode> builder) { }
}
