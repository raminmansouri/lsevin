using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.Logout;

internal sealed record LogoutCommand : Command<bool>;
