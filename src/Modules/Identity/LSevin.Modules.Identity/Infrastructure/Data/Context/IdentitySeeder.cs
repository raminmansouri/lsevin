using BuildingBlocks.Core.Persistence.Context;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.AspNetCore.Identity;

namespace LSevin.Modules.Identity.Infrastructure.Data.Context;

internal sealed class IdentitySeeder(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
    : IDbSeeder
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedRoles();
        await SeedUsers();
    }

    private async Task SeedRoles()
    {
        if (!await roleManager.RoleExistsAsync(ApplicationRole.User.Name ?? ""))
            await roleManager.CreateAsync(ApplicationRole.Admin);

        if (!await roleManager.RoleExistsAsync(ApplicationRole.User.Name ?? ""))
            await roleManager.CreateAsync(ApplicationRole.User);
    }

    private async Task SeedUsers()
    {
        if (await userManager.FindByEmailAsync("pouryanoufallah@gmail.com") == null)
        {
            var user = new ApplicationUser
            {
                UserName = "pourya-admin",
                FirstName = "Pourya",
                LastName = "nofallah",
                Email = "pouryanoufallah@gmail.com",
                EmailConfirmed = true,
                PhoneNumberCountryCode = "US",
                PhoneNumber = "4065349951",
                PhoneNumberConfirmed = true,
            };

            var result = await userManager.CreateAsync(user, "123456");

            if (result.Succeeded)
                await userManager.AddToRoleAsync(user, ApplicationRole.Admin.Name ?? "");
        }

        if (await userManager.FindByEmailAsync("pouryanoufallah@yahoo.com") == null)
        {
            var user = new ApplicationUser
            {
                UserName = "pourya-user",
                FirstName = "Pourya",
                LastName = "Nofallah",
                Email = "pouryanoufallah@yahoo.com",
                PhoneNumberCountryCode = "IR",
                PhoneNumber = "9126108806",
                PhoneNumberConfirmed = true,
            };

            var result = await userManager.CreateAsync(user, "123456");

            if (result.Succeeded)
                await userManager.AddToRoleAsync(user, ApplicationRole.User.Name ?? "");
        }
    }
}
