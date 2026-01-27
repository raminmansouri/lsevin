using System.Security.Claims;
using BuildingBlocks.Security.Jwt.Models;

namespace BuildingBlocks.Security.Jwt.Services;

/// <summary>
/// JWT Service interface for handling JSON Web Tokens.
/// </summary>
public interface IJwtService
{
    /// <summary>
    /// Generates a JSON Web Token (JWT) for the specified user ID and role.
    /// </summary>
    /// <param name="userName">The username for whom the JWT is created.</param>
    /// <param name="email">The user's email.</param>
    /// <param name="userId">The user ID for whom the JWT is created.</param>
    /// <param name="isVerified">The user's verified status.</param>
    /// <param name="fullName">The user's full name.</param>
    /// <param name="refreshToken">The refresh token.</param>
    /// <param name="usersClaims">The user's claims.</param>
    /// <param name="rolesClaims">The user's roles.</param>
    /// <param name="permissionsClaims">The user's permissions.</param>
    /// <returns>A result containing the generated JWT.</returns>
    GenerateTokenResult GenerateJwtToken(
        string userName,
        string email,
        string userId,
        bool? isVerified = null,
        string? fullName = null,
        string? refreshToken = null,
        IReadOnlyList<Claim>? usersClaims = null,
        IReadOnlyList<string>? rolesClaims = null,
        IReadOnlyList<string>? permissionsClaims = null
    );

    /// <summary>
    /// Gets the principal from the token.
    /// </summary>
    /// <param name="token">The token to get the principal from.</param>
    /// <returns>The principal from the token.</returns>
    ClaimsPrincipal? GetPrincipalFromToken(string token);
}
