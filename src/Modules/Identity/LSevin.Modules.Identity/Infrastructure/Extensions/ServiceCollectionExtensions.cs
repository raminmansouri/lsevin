using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Infrastructure.Configurations;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LSevin.Modules.Identity.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCustomIdentity(
        this IServiceCollection services,
        IConfiguration configuration,
        string optionSection = nameof(IdentityOptions),
        Action<IdentityOptions>? configure = null
    )
    {
        // https://github.com/IdentityServer/IdentityServer4/issues/1525
        // some dependencies will add here if not registered before
        services
            .AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                // Password settings.
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 3;
                options.Password.RequiredUniqueChars = 1;

                // Lockout settings.
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                // User settings.
                options.User.RequireUniqueEmail = true;

                options.SignIn.RequireConfirmedEmail = false;
                options.SignIn.RequireConfirmedPhoneNumber = false;

                configure?.Invoke(options);
            })
            .AddEntityFrameworkStores<IdentityContext>()
            .AddDefaultTokenProviders();

        services.Configure<IdentityOptions>(configuration.GetSection(optionSection));

        return services;
    }

    public static IServiceCollection AddCustomIdentityServer(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services
            .AddIdentityServer(options =>
            {
                options.LicenseKey = configuration["Identity:LicenseKey"];
                options.Events.RaiseErrorEvents = true;
                options.Events.RaiseInformationEvents = true;
                options.Events.RaiseFailureEvents = true;
                options.Events.RaiseSuccessEvents = true;
            })
            .AddDeveloperSigningCredential() // This is for dev only scenarios when you don’t have a certificate to use.
            .AddInMemoryIdentityResources(IdentityServerConfig.IdentityResources)
            .AddInMemoryApiResources(IdentityServerConfig.ApiResources)
            .AddInMemoryApiScopes(IdentityServerConfig.ApiScopes)
            .AddInMemoryClients(IdentityServerConfig.Clients)
            .AddAspNetIdentity<ApplicationUser>()
            .AddProfileService<IdentityProfileService>();

        return services;
    }
}
