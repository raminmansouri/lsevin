using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Common.IntegrationEvents.User;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.User.Features.UpdateUser;

internal sealed class UpdateUserCommandHandler(
    UserManager<ApplicationUser> userManager,
    IUserAccessor userAccessor,
    IEventBus bus
) : CommandHandler<UpdateUserCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var userId = userAccessor.GetUserIdentity;
        var identityUser = await userManager.FindByIdAsync(userId.ToString());
        if (identityUser is null)
            return AppError.NotFoundErrorMessage(SharedResource.User);

        // Check if phone number is already in use by another user
        var existingUserWithPhone = await userManager.Users.AnyAsync(
            x =>
                x.Id != userId
                && // Exclude current user
                x.PhoneNumberCountryCode == request.PhoneNumberCountryCode
                && x.PhoneNumber == request.PhoneNumber,
            cancellationToken
        );

        if (existingUserWithPhone)
        {
            return AppError.ApplicationErrorMessage(SharedResource.Email_Uniqueness_Error_Message);
        }

        identityUser.FirstName = request.FirstName;
        identityUser.LastName = request.LastName;
        identityUser.UserName = request.UserName;
        identityUser.Email = request.Email;
        identityUser.PhoneNumberCountryCode = request.PhoneNumberCountryCode;
        identityUser.PhoneNumber = request.PhoneNumber;

        var updateResult = await userManager.UpdateAsync(identityUser);

        if (!updateResult.Succeeded)
        {
            return AppError.ApplicationErrorMessage(updateResult.Errors.First().Description);
        }

        var userBaseInfoUpdated = new UserUpdatedIntegrationEvent(
            userId,
            request.Email,
            request.PhoneNumberCountryCode,
            request.PhoneNumber,
            request.FirstName,
            request.LastName
        );

        await bus.PublishAsync(userBaseInfoUpdated, cancellationToken);

        return userId;
    }
}
