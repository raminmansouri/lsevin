using System.IdentityModel.Tokens.Jwt;
using BuildingBlocks.Core.Web.Extensions;
using BuildingBlocks.Security.Jwt.Models;
using BuildingBlocks.Security.Jwt.Options;
using BuildingBlocks.Security.Jwt.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Security.Jwt.Extensions;

/// <summary>
/// Represents the settings for JWT (JSON Web Token) authentication.
/// </summary>
public static class AuthExtensions
{
    /// <summary>
    /// Apply the base authentication service.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="authProviderKey">The authentication provider key.</param>
    /// <returns>The modified service collection.</returns>
    public static IServiceCollection AddBaseAuthenticationService(
        this IServiceCollection services,
        string authProviderKey = JwtBearerDefaults.AuthenticationScheme
    )
    {
        JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
        JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

        services
            .AddValidatedOptions<JwtOptions>()
            .ConfigureOptions<ConfigureJwtBearerOptions>()
            .AddAuthentication(authProviderKey)
            .AddJwtBearer(authProviderKey);

        return services;
    }

    /// <summary>
    /// Apply the base authorization service.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="claimPolicies">The claim policies.</param>
    /// <param name="rolePolicies">The role policies.</param>
    /// <param name="scheme">The scheme.</param>
    /// <returns>The modified service collection.</returns>
    public static IServiceCollection AddBaseAuthorizationService(
        this IServiceCollection services,
        IReadOnlyCollection<ClaimPolicy>? claimPolicies = null,
        IReadOnlyCollection<RolePolicy>? rolePolicies = null,
        string scheme = JwtBearerDefaults.AuthenticationScheme
    )
    {
        services.AddAuthorization(options =>
        {
            var defaultAuthorizationPolicyBuilder = new AuthorizationPolicyBuilder(scheme);

            defaultAuthorizationPolicyBuilder = defaultAuthorizationPolicyBuilder.RequireAuthenticatedUser();

            options.DefaultPolicy = defaultAuthorizationPolicyBuilder.Build();

            if (claimPolicies is not null)
            {
                foreach (var policy in claimPolicies)
                {
                    options.AddPolicy(
                        policy.Name,
                        x =>
                        {
                            x.AuthenticationSchemes.Add(scheme);

                            foreach (var policyClaim in policy.Claims)
                            {
                                x.RequireClaim(policyClaim.Type, policyClaim.Value);
                            }
                        }
                    );
                }
            }

            if (rolePolicies is not null)
            {
                foreach (var rolePolicy in rolePolicies)
                {
                    options.AddPolicy(
                        rolePolicy.Name,
                        x =>
                        {
                            x.AuthenticationSchemes.Add(scheme);
                            x.RequireRole(rolePolicy.Roles);
                        }
                    );
                }
            }
        });

        return services;
    }

    /// <summary>
    /// Apply the JWT service.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The modified service collection.</returns>
    public static IServiceCollection AddJwtService(this IServiceCollection services)
    {
        services.AddValidatedOptions<JwtOptions>();

        services.AddTransient<IJwtService, JwtService>();

        return services;
    }

    /// <summary>
    /// Apply the user accessor service.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The modified service collection.</returns>
    public static IServiceCollection AddUserAccessor(this IServiceCollection services)
    {
        services.AddScoped<IUserAccessor, UserAccessor>();

        return services;
    }
}
