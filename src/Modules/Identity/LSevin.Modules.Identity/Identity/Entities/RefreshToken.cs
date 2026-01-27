using System.Security.Cryptography;
using BuildingBlocks.Core.Clock;

namespace LSevin.Modules.Identity.Identity.Entities;

public class RefreshToken
{
    public Guid UserId { get; set; }
    public required string Token { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiredAt { get; set; }
    public required string CreatedByIp { get; set; }
    public bool IsExpired => SystemClock.Now >= ExpiredAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;
    public DateTime? RevokedAt { get; set; }
    public ApplicationUser? ApplicationUser { get; set; }

    public static string GetRefreshToken()
    {
        var randomNumber = new byte[32];
        using var randomNumberGenerator = RandomNumberGenerator.Create();
        randomNumberGenerator.GetBytes(randomNumber);

        var refreshToken = Convert.ToBase64String(randomNumber);

        return refreshToken;
    }

    public bool IsRefreshTokenValid(double? ttlRefreshToken = null)
    {
        // Token already expired or revoked, then return false
        if (!IsActive)
            return false;

        if (ttlRefreshToken is not null && CreatedAt.AddDays((long)ttlRefreshToken) <= SystemClock.Now)
            return false;

        return true;
    }
}
