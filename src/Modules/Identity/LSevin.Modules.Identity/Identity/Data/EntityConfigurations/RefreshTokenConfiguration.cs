using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Identity.Identity.Data.EntityConfigurations;

internal sealed class RefreshTokenConfiguration
    : EntityConfigConfigurationContracts<RefreshToken>,
        IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable(nameof(RefreshToken).Pluralize().Underscore());

        builder.Property<Guid>("Id").ValueGeneratedOnAdd();

        builder.HasKey("Id");

        builder.Property(rt => rt.Token).HasMaxLength(DomainConstValues.RefreshTokenMaxLength);
        builder.Property(rt => rt.CreatedAt);
        builder.Ignore(rt => rt.IsActive);
        builder.Ignore(rt => rt.IsExpired);
    }

    public override void ConfigRelationships(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasOne(rt => rt.ApplicationUser).WithMany(au => au.RefreshTokens).HasForeignKey(x => x.UserId);
    }

    public override void ConfigIndexes(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasIndex(x => new { x.Token, x.UserId }).IsUnique();
    }
}
