namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// GenerateTokenResult model represents a JSON Web Token.
/// </summary>
/// <param name="AccessToken">The JWT access token as a string.</param>
/// <param name="ExpireAt">The number of seconds until the JWT token expires.</param>
public record GenerateTokenResult(string AccessToken, DateTime ExpireAt);
