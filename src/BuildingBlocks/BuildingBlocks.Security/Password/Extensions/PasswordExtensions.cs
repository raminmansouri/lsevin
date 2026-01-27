using BuildingBlocks.Security.Password.Services;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Security.Password.Extensions;

/// <summary>
/// Represents the settings for password manager.
/// </summary>
public static class PasswordExtensions
{
    /// <summary>
    /// Add the password manager service.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The modified service collection.</returns>
    public static IServiceCollection AddPasswordManager(this IServiceCollection services)
    {
        services.AddSingleton<IPasswordManager, PasswordManager>();

        return services;
    }
}
