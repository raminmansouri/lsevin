using BuildingBlocks.Caching.Services;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Options;
using Microsoft.Extensions.Options;

namespace LSevin.Modules.Identity.Identity.Features.RevokeAccessToken;

internal sealed class RevokeAccessTokenCommandHandler(ICachingService cachingService, IOptions<JwtOptions> jwtOptions)
    : CommandHandler<RevokeAccessTokenCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        RevokeAccessTokenCommand request,
        CancellationToken cancellationToken
    )
    {
        await cachingService.SetAsync(
            $"{request.UserName}_{request.Token}_revoked_token",
            request.Token,
            expiration: TimeSpan.FromSeconds(jwtOptions.Value.TokenLifeTimeSecond),
            cancellationToken: cancellationToken
        );

        return true;
    }
}
