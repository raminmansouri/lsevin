using BuildingBlocks.Core.Persistence.Context;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.AspNetCore.Identity;
using IdentityConstants = LSevin.Modules.Identity.Constants.IdentityConstants;

namespace LSevin.Modules.Identity.Infrastructure.Data.Context;

internal sealed class IdentitySeeder(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
    : IDbSeeder
{
    // The account promoted to SuperAdmin on startup (idempotent).
    private const string SuperAdminEmail = "raminmansouripouya@gmail.com";

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedRoles();
        await EnsureSuperAdmin();
    }

    private async Task SeedRoles()
    {
        foreach (var role in new[] { ApplicationRole.User, ApplicationRole.Admin, ApplicationRole.SuperAdmin })
        {
            if (!await roleManager.RoleExistsAsync(role.Name ?? ""))
                await roleManager.CreateAsync(role);
        }
    }

    // NOTE: the demo pourya-admin/pourya-user accounts are intentionally NOT seeded anymore.
    // Instead, the real operator account is promoted to SuperAdmin if it already exists.
    // This is idempotent and safe to run on every startup.
    private async Task EnsureSuperAdmin()
    {
        var superAdmin = await userManager.FindByEmailAsync(SuperAdminEmail);
        if (superAdmin is null)
            return;

        if (!await userManager.IsInRoleAsync(superAdmin, IdentityConstants.Role.SuperAdmin))
            await userManager.AddToRoleAsync(superAdmin, IdentityConstants.Role.SuperAdmin);
    }
}
