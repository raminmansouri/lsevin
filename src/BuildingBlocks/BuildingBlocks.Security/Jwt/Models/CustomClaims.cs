namespace BuildingBlocks.Security.Jwt.Models;

/// <summary>
/// Represents the custom claims.
/// </summary>
public static class CustomClaimTypes
{
    /// <summary>
    /// The permission claim.
    /// </summary>
    public const string Permission = "permission";

    /// <summary>
    /// The IP address claim.
    /// </summary>
    public const string IpAddress = "ipAddress";

    /// <summary>
    /// The refresh token claim.
    /// </summary>
    public const string RefreshToken = "refreshToken";
}
