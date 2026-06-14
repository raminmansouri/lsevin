using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Features.GenerateJwtToken;
using LSevin.Modules.Identity.Identity.Features.GenerateRefreshToken;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Identity.Features.VerifyOtp;

internal sealed class VerifyOtpCommandHandler(
    IdentityContext context,
    ICommandBus commandBus,
    UserManager<ApplicationUser> userManager
) : CommandHandler<VerifyOtpCommand, VerifyOtpResponse>
{
    public override async Task<Result<VerifyOtpResponse>> Handle(
        VerifyOtpCommand command,
        CancellationToken cancellationToken
    )
    {
        // 1. Parse the E.164 formatted phone number from command to PhoneNumber value object
        var commandPhoneNumber = PhoneNumberExtensions.ParseFromE164(command.PhoneNumber);

        // 2. Find active code by OTP code AND phone number (both value and country code)
        // Both the OTP code and phone number serve as proof of identity
        var phoneLoginCode = await context
            .PhoneLoginCodes.Where(c =>
                c.Code == command.Code
                && c.PhoneNumber.Value == commandPhoneNumber.Value
                && c.PhoneNumber.CountryCode == commandPhoneNumber.CountryCode
                && !c.IsInvalidated
                && c.UsedAt == null
                && c.ExpiresAt > SystemClock.Now
            )
            .OrderByDescending(c => c.SentAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (phoneLoginCode == null)
        {
            return AppError.ApplicationErrorMessage("Invalid or expired OTP code.");
        }

        // 3. Check if can be verified
        if (!phoneLoginCode.CanBeVerified())
        {
            phoneLoginCode.IncrementAttemptCount();
            await context.SaveChangesAsync(cancellationToken);

            return AppError.ApplicationErrorMessage(
                phoneLoginCode.AttemptCount >= DomainConstValues.MaxPhoneLoginCodeVerifyAttempts
                    ? "Too many failed attempts. Please request a new code."
                    : "Invalid OTP code."
            );
        }

        // 4. Mark as used
        phoneLoginCode.MarkAsUsed();
        await context.SaveChangesAsync(cancellationToken);

        // 5. Get user with roles for JWT using the PhoneNumber value object from the OTP code
        var identityUser = await userManager.FindUserWithRoleByPhoneNumberAsync(
            phoneLoginCode.PhoneNumber.ToE164Format(),
            cancellationToken: cancellationToken
        );

        // Additional security check: Verify OTP belongs to a valid user
        if (identityUser == null || identityUser.Id != phoneLoginCode.UserId)
        {
            return AppError.NotFoundErrorMessage(SharedResource.User);
        }

        // 6. Generate refresh token using the user ID from the OTP code
        var refreshTokenResult = await commandBus.SendAsync(
            new GenerateRefreshTokenCommand(phoneLoginCode.UserId),
            cancellationToken
        );

        if (refreshTokenResult.IsFailure)
            return refreshTokenResult.Errors!.First();

        // 7. Generate JWT token
        var accessTokenResult = await commandBus.SendAsync(
            new GenerateJwtTokenCommand(identityUser.ToJwtUserDto(), refreshTokenResult.Value!.Token),
            cancellationToken
        );

        if (accessTokenResult.IsFailure)
            return accessTokenResult.Errors!.First();

        // 8. Return tokens with complete user details
        return new VerifyOtpResponse(
            UserId: identityUser.Id,
            FirstName: identityUser.FirstName,
            LastName: identityUser.LastName,
            Username: identityUser.UserName!,
            Email: identityUser.Email ?? string.Empty,
            PhoneNumberCountryCode: identityUser.PhoneNumberCountryCode,
            PhoneNumber: identityUser.PhoneNumber ?? string.Empty,
            LastLoggedInAt: identityUser.LastLoggedInAt,
            Roles: [.. identityUser.UserRoles.Where(ur => ur.Role != null).Select(ur => ur.Role!.Name!)],
            UserState: (int)identityUser.UserState,
            CreatedAt: identityUser.CreatedAt,
            AccessToken: accessTokenResult.Value!.Token,
            RefreshToken: refreshTokenResult.Value.Token
        );
    }
}
