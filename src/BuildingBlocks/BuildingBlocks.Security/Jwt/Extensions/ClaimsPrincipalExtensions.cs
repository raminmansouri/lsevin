using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BuildingBlocks.Core.Generators;

namespace BuildingBlocks.Security.Jwt.Extensions;

/// <summary>
/// Represents extension methods for <see cref="ClaimsPrincipal"/>.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Gets the user identity from the claims principal.
    /// </summary>
    /// <param name="principal">The claims principal.</param>
    /// <returns>The user identity.</returns>
    public static Guid GetUserIdentity(this ClaimsPrincipal? principal)
    {
        var userIdentity = principal?.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(userIdentity, out var parsedUserId) ? parsedUserId : IdGenerator.EmptyId;
    }

    /// <summary>
    /// Gets the user identity from the claims principal.
    /// </summary>
    /// <param name="principal">The claims principal.</param>
    /// <returns>The user identity.</returns>
    public static bool IsAuthenticated(this ClaimsPrincipal? principal)
    {
        var isAuthenticated = principal?.Identities.FirstOrDefault()?.IsAuthenticated;
        return isAuthenticated.HasValue && isAuthenticated.Value;
    }

    /// <summary>
    /// Gets the user email from the claims principal.
    /// </summary>
    /// <param name="principal">The claims principal.</param>
    /// <returns>The user email.</returns>
    public static string GetUserEmail(this ClaimsPrincipal? principal)
    {
        return principal?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }

    /// <summary>
    /// Gets the user full name from the claims principal.
    /// </summary>
    /// <param name="principal">The claims principal.</param>
    /// <returns>The user full name.</returns>
    public static string GetUserFullName(this ClaimsPrincipal? principal)
    {
        return principal?.FindFirstValue(JwtRegisteredClaimNames.Name) ?? string.Empty;
    }
}
