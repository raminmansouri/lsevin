namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// Represents the payload of an authentication process, typically to be embedded in an authentication refresh token.
/// </summary>
/// <param name="ExpiredToken"> Gets the expired token. </param>
/// <param name="RefreshToken"> Gets the refresh token. </param>
public record GenerateRefreshTokenPayload(string ExpiredToken, string RefreshToken);
