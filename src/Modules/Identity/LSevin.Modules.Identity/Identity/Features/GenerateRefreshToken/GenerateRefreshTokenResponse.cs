namespace LSevin.Modules.Identity.Identity.Features.GenerateRefreshToken;

internal sealed record GenerateRefreshTokenResponse(
    DateTime CreatedAt,
    DateTime ExpireAt,
    bool IsExpired,
    bool IsRevoked,
    bool IsActive,
    DateTime? RevokedAt,
    string Token = null!,
    string CreatedByIp = null!
);
