using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.RevokeAccessToken;

internal sealed record RevokeAccessTokenCommand(string Token, string UserName) : Command<bool>;
