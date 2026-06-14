using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Types;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Identity.Identity.Data.EntityConfigurations;

internal sealed class ApplicationRoleConfiguration
    : EntityConfigConfigurationContracts<ApplicationRole>,
        IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder) =>
        builder.Tap(ConfigDataStructure).Tap(ConfigRelationships).Tap(ConfigIndexes);

    public override void ConfigDataStructure(EntityTypeBuilder<ApplicationRole> builder) { }

    public override void ConfigRelationships(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.HasMany(e => e.UserRoles).WithOne(e => e.Role).HasForeignKey(ur => ur.RoleId).IsRequired();
    }

    public override void ConfigIndexes(EntityTypeBuilder<ApplicationRole> builder) { }
}
