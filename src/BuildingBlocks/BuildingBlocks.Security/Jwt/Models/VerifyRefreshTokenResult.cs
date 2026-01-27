namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// VerifyRefreshTokenResult model represents a result of verifying a refresh token.
/// </summary>
/// <param name="UserId">The user ID for whom the JWT is created.</param>
/// <param name="Email">The user's email.</param>
/// <param name="FullName">The user's full name.</param>
/// <param name="RoleClaims">The user's roles (optional).</param>
/// <param name="Audiences">The audiences for the JWT (optional).</param>
public sealed record VerifyRefreshTokenResult(
    Guid UserId,
    string Email,
    string FullName,
    IReadOnlyList<string>? RoleClaims,
    IReadOnlyList<string>? Audiences
);
