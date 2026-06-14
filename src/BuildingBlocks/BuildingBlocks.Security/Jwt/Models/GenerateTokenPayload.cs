namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// Represents the payload of an authentication process, typically to be embedded in an authentication token.
/// </summary>
/// <param name="UserId"> Gets the User ID for the payload. </param>
/// <param name="Email"> Gets the User Email for the payload. </param>
/// <param name="FullName"> Gets the User FullName for the payload. </param>
/// <param name="RoleClaims"> Gets the Role for the payload.
/// This can be used for role-based access control (RBAC). </param>
public sealed record GenerateTokenPayload(
    Guid UserId,
    string Email,
    string FullName,
    IReadOnlyList<string>? RoleClaims
);
