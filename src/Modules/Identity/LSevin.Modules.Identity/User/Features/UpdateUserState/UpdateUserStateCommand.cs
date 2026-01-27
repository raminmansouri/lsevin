using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Modules.Identity.Identity.Enums;

namespace LSevin.Modules.Identity.User.Features.UpdateUserState;

internal sealed record UpdateUserStateCommand(Guid UserId, UserState State) : Command<bool>;
