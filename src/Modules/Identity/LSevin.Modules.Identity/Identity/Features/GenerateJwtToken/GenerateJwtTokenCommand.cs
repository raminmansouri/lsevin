using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.Identity.Features.GenerateJwtToken;

internal sealed record GenerateJwtTokenCommand(JwtUserDto User, string RefreshToken)
    : Command<GenerateJwtTokenResponse>;
