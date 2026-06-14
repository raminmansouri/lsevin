using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Common.IntegrationEvents.User;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Enums;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using IdentityConstants = LSevin.Modules.Identity.Constants.IdentityConstants;

namespace LSevin.Modules.Identity.User.Features.RegisterUser;

internal sealed class RegisterUserCommandHandler(UserManager<ApplicationUser> userManager, IEventBus bus)
    : CommandHandler<RegisterUserCommand, RegisterUserResponse>
{
    public override async Task<Result<RegisterUserResponse>> Handle(
        RegisterUserCommand request,
        CancellationToken cancellationToken
    )
    {
        var existingUserWithPhone = await userManager.Users.AnyAsync(
            x => x.PhoneNumberCountryCode == request.PhoneNumberCountryCode && x.PhoneNumber == request.PhoneNumber,
            cancellationToken
        );

        if (existingUserWithPhone)
        {
            return AppError.ApplicationErrorMessage(SharedResource.Phone_Number_Uniqueness_Error_Message);
        }

        var applicationUser = new ApplicationUser
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            UserName = request.UserName,
            Email = request.Email,
            PhoneNumberCountryCode = request.PhoneNumberCountryCode,
            PhoneNumber = request.PhoneNumber,
            UserState = UserState.Active,
            CreatedAt = request.CreatedAt,
        };

        var identityResult = await userManager.CreateAsync(applicationUser, request.Password);

        if (!identityResult.Succeeded)
        {
            return AppError.ApplicationErrorMessage(identityResult.Errors.First().Description);
        }

        var roleResult = await userManager.AddToRolesAsync(
            applicationUser,
            request.Roles ?? [IdentityConstants.Role.User]
        );

        if (!roleResult.Succeeded)
        {
            return AppError.ApplicationErrorMessage(roleResult.Errors.First().Description);
        }

        var userRegistered = new UserRegisteredIntegrationEvent(
            applicationUser.Id,
            applicationUser.Email,
            applicationUser.PhoneNumberCountryCode,
            applicationUser.PhoneNumber,
            applicationUser.UserName,
            applicationUser.FirstName,
            applicationUser.LastName,
            request.Roles
        );

        // publish our integration event and save to outbox should do in same transaction of our business logic actions. we could use TxBehaviour or ITxDbContextExecutes interface
        // This service is not DDD, so we couldn't use DomainEventPublisher to publish mapped integration events
        await bus.PublishAsync(userRegistered, cancellationToken);

        return new RegisterUserResponse(
            new IdentityUserDto(
                Id: applicationUser.Id,
                Email: applicationUser.Email,
                PhoneNumberCountryCode: applicationUser.PhoneNumberCountryCode,
                PhoneNumber: applicationUser.PhoneNumber,
                UserName: applicationUser.UserName,
                FirstName: applicationUser.FirstName,
                LastName: applicationUser.LastName,
                LastLoggedInAt: applicationUser.LastLoggedInAt,
                Roles: request.Roles ?? [IdentityConstants.Role.User],
                CreatedAt: request.CreatedAt,
                UserState: UserState.Active
            )
        );
    }
}
