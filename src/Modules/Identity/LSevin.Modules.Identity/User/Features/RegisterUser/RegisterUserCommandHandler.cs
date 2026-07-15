using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Common.IntegrationEvents.User;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Enums;
using LSevin.Modules.Identity.Identity.Services;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using IdentityConstants = LSevin.Modules.Identity.Constants.IdentityConstants;

namespace LSevin.Modules.Identity.User.Features.RegisterUser;

internal sealed class RegisterUserCommandHandler(
    UserManager<ApplicationUser> userManager,
    IEventBus bus,
    IdentityContext context,
    IOtpCodeGeneratorService otpGenerator,
    IOtpSenderService otpSender,
    ILogger<RegisterUserCommandHandler> logger
) : CommandHandler<RegisterUserCommand, RegisterUserResponse>
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

        // Send an OTP code so the user can verify their phone number right after signing up.
        await SendPhoneVerificationOtpAsync(applicationUser, cancellationToken);

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

    /// <summary>
    /// Generates and persists a phone-login OTP code for the newly registered user and dispatches it
    /// through <see cref="IOtpSenderService"/> (routed to MeliPayamak for Iranian numbers, Whatsiplus otherwise).
    /// Delivery failures are logged rather than thrown: the account already exists, so the user can
    /// simply request a new code via the resend endpoint instead of the whole signup failing.
    /// </summary>
    private async Task SendPhoneVerificationOtpAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var phoneNumber = PhoneNumber.Create(user.PhoneNumber!, user.PhoneNumberCountryCode);

        var code = otpGenerator.GenerateCode();
        var sentAt = SystemClock.Now;
        var expiresAt = otpGenerator.CalculateExpiration(sentAt);

        var phoneLoginCode = new PhoneLoginCode
        {
            Id = IdGenerator.NewId(),
            UserId = user.Id,
            PhoneNumber = phoneNumber,
            Code = code,
            SentAt = sentAt,
            ExpiresAt = expiresAt,
            AttemptCount = 0,
            IsInvalidated = false,
        };

        await context.PhoneLoginCodes.AddAsync(phoneLoginCode, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var sendResult = await otpSender.SendOtpCodeAsync(phoneNumber, code, cancellationToken);
        if (!sendResult.IsSuccess)
        {
            logger.LogWarning(
                "[Register] - User {UserId} was created but the phone verification OTP could not be delivered.",
                user.Id
            );
        }
    }
}
