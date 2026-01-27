using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Types;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Identity.Identity.Data.EntityConfigurations;

internal sealed class AccessTokenConfiguration
    : EntityConfigConfigurationContracts<AccessToken>,
        IEntityTypeConfiguration<AccessToken>
{
    public void Configure(EntityTypeBuilder<AccessToken> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<AccessToken> builder)
    {
        builder.ToTable(nameof(AccessToken).Pluralize().Underscore());

        builder.Property<Guid>("Id").ValueGeneratedOnAdd();

        builder.HasKey("Id");

        builder.Property(rt => rt.Token).IsRequired().HasMaxLength(DomainConstValues.TokenMaxLength);

        builder.Property(rt => rt.CreatedAt).IsRequired();
        builder.Property(rt => rt.ExpiredAt).IsRequired();

        builder.Property(rt => rt.CreatedByIp).IsRequired().HasMaxLength(DomainConstValues.AccessTokenIpMaxLength);
    }

    public override void ConfigRelationships(EntityTypeBuilder<AccessToken> builder)
    {
        builder.HasOne(rt => rt.ApplicationUser).WithMany(au => au.AccessTokens).HasForeignKey(x => x.UserId);
    }

    public override void ConfigIndexes(EntityTypeBuilder<AccessToken> builder)
    {
        builder.HasIndex(x => new { x.Token, x.UserId }).IsUnique();
    }
}
