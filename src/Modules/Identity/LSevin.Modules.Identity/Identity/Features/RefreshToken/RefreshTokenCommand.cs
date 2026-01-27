using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.RefreshToken;

internal sealed record RefreshTokenCommand(string AccessTokenData, string RefreshTokenData)
    : Command<RefreshTokenResponse>;
