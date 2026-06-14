namespace BuildingBlocks.Security.Jwt.Options;

/// <summary>
/// Represents the settings for JWT (JSON Web Token) authentication.
/// </summary>
public sealed class JwtOptions
{
    /// <summary>
    /// Gets or sets the algorithm used for JWT token generation and validation.
    /// </summary>
    public string? Algorithm { get; set; }

    /// <summary>
    /// Gets the issuer of the JWT.
    /// </summary>
    public required string Issuer { get; init; }

    /// <summary>
    /// Gets the secret key used for JWT token generation and validation.
    /// </summary>
    public required string SecretKey { get; init; }

    /// <summary>
    /// Gets the audience of the JWT.
    /// </summary>
    public string? Audience { get; init; }

    /// <summary>
    /// Gets the number of minutes until the JWT token expires.
    /// </summary>
    public int TokenLifeTimeSecond { get; init; }

    /// <summary>
    /// Gets or sets a value indicating whether to check revoked access tokens.
    /// </summary>
    public bool CheckRevokedAccessTokens { get; set; }
}
