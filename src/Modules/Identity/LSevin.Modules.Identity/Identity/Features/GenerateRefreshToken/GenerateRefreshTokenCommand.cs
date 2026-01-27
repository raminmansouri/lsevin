using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.GenerateRefreshToken;

internal sealed record GenerateRefreshTokenCommand(Guid UserId, string? Token = null)
    : Command<GenerateRefreshTokenResponse>;
