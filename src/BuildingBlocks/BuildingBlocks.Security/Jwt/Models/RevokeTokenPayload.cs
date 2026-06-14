namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// Represents the payload of an authentication process, typically to be embedded in an authentication token.
/// </summary>
/// <param name="UserId"> Gets the User ID for the payload. </param>
/// <param name="RefreshToken"> Gets the refresh token. </param>
public record RevokeTokenPayload(Guid UserId, string RefreshToken);
