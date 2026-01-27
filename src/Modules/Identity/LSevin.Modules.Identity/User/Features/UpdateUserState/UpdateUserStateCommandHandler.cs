using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Common.IntegrationEvents.User;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Enums;
using LSevin.Modules.Identity.Resources;
using Microsoft.AspNetCore.Identity;
using IdentityConstants = LSevin.Modules.Identity.Constants.IdentityConstants;

namespace LSevin.Modules.Identity.User.Features.UpdateUserState;

internal sealed class UpdateUserStateCommandHandler(IEventBus bus, UserManager<ApplicationUser> userManager)
    : CommandHandler<UpdateUserStateCommand, bool>
{
    public override async Task<Result<bool>> Handle(UpdateUserStateCommand request, CancellationToken cancellationToken)
    {
        Guard.Against.Null(request, nameof(UpdateUserStateCommand));

        var identityUser = await userManager.FindByIdAsync(request.UserId.ToString());
        if (identityUser is null)
            return AppError.NotFoundErrorMessage(SharedResource.User);

        var previousState = identityUser.UserState;

        if (previousState == request.State)
        {
            return AppError.ApplicationErrorMessage(IdentityResource.User_State_Cannot_Be_Changed);
        }

        if (await userManager.IsInRoleAsync(identityUser, IdentityConstants.Role.Admin))
        {
            return AppError.ApplicationErrorMessage(IdentityResource.Cannot_Update_State_Of_Admin);
        }

        identityUser.UserState = request.State;

        await userManager.UpdateAsync(identityUser);

        var userStateUpdated = new UserStateUpdatedIntegrationEvent(
            request.UserId,
            IsActive: request.State == UserState.Active
        );

        await bus.PublishAsync(userStateUpdated, cancellationToken);

        return true;
    }
}
