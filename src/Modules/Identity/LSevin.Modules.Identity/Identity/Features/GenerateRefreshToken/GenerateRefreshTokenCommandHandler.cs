using Ardalis.GuardClauses;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Utils;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Resources;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Identity.Features.GenerateRefreshToken;

internal sealed class GenerateRefreshTokenCommandHandler(IdentityContext context)
    : CommandHandler<GenerateRefreshTokenCommand, GenerateRefreshTokenResponse>
{
    // Threshold in days before expiry when we should generate a new token
    private const int RefreshTokenRenewalThresholdDays = 5;

    public override async Task<Result<GenerateRefreshTokenResponse>> Handle(
        GenerateRefreshTokenCommand request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(GenerateRefreshTokenCommand));

        var refreshToken = await context
            .Set<Entities.RefreshToken>()
            .FirstOrDefaultAsync(rt => rt.UserId == request.UserId && rt.Token == request.Token, cancellationToken);

        var now = SystemClock.Now;

        if (refreshToken is null)
        {
            // Create new refresh token if none exists
            refreshToken = await CreateNewRefreshToken(request.UserId, now, cancellationToken);
        }
        else
        {
            if (!refreshToken.IsRefreshTokenValid())
            {
                return AppError.ApplicationErrorMessage(
                    SharedResource.Validation_Error_Message.FormatWithStr(IdentityResource.Token)
                );
            }

            // Check if token needs renewal (close to expiry)
            if (ShouldRenewRefreshToken(refreshToken))
            {
                refreshToken = await CreateNewRefreshToken(request.UserId, now, cancellationToken);
            }

            // Otherwise, keep using the existing valid token
        }

        // Remove old refresh tokens
        await RemoveOldRefreshTokensAsync(request.UserId, cancellationToken: cancellationToken);

        return new GenerateRefreshTokenResponse(
            refreshToken.CreatedAt,
            refreshToken.ExpiredAt,
            IsExpired: !refreshToken.IsRefreshTokenValid(),
            refreshToken.IsRevoked,
            refreshToken.IsActive,
            refreshToken.RevokedAt,
            refreshToken.Token,
            refreshToken.CreatedByIp
        );
    }

    private async Task<Entities.RefreshToken> CreateNewRefreshToken(
        Guid userId,
        DateTime now,
        CancellationToken cancellationToken
    )
    {
        var token = Entities.RefreshToken.GetRefreshToken();
        var refreshToken = new Entities.RefreshToken
        {
            UserId = userId,
            Token = token,
            CreatedAt = now,
            ExpiredAt = now.AddDays(30),
            CreatedByIp = IpUtilities.GetIpAddress(),
        };

        await context.Set<Entities.RefreshToken>().AddAsync(refreshToken, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return refreshToken;
    }

    private static bool ShouldRenewRefreshToken(Entities.RefreshToken refreshToken)
    {
        // Renew if token is revoked, expired, or close to expiry
        return refreshToken.IsRevoked
            || refreshToken.IsExpired
            || refreshToken.ExpiredAt <= SystemClock.Now.AddDays(RefreshTokenRenewalThresholdDays);
    }

    private Task<int> RemoveOldRefreshTokensAsync(
        Guid userId,
        long? ttlRefreshToken = null,
        CancellationToken cancellationToken = default
    )
    {
        var refreshTokens = context.Set<Entities.RefreshToken>().Where(rt => rt.UserId == userId);

        refreshTokens.ToList().RemoveAll(x => !x.IsRefreshTokenValid(ttlRefreshToken));

        return context.SaveChangesAsync(cancellationToken);
    }
}
