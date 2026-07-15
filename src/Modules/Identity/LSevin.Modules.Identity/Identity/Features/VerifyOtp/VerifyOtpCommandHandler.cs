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

        // Normalize Persian/Arabic-Indic digits to ASCII so a code typed on a localized
        // keyboard (e.g. "۳۵۴۲۲۷") matches the ASCII code stored at send time ("354227").
        var code = NormalizeDigits(command.Code);

        // 2. Find active code by OTP code AND phone number (both value and country code)
        // Both the OTP code and phone number serve as proof of identity
        var phoneLoginCode = await context
            .PhoneLoginCodes.Where(c =>
                c.Code == code
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

        // Mark the phone number as verified now that the user has proven ownership via the OTP code.
        // Login requires a confirmed phone number, so this closes the signup verification loop.
        if (!identityUser.PhoneNumberConfirmed)
        {
            identityUser.PhoneNumberConfirmed = true;
            await userManager.UpdateAsync(identityUser);
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

    // Converts Persian (U+06F0–U+06F9) and Arabic-Indic (U+0660–U+0669) digits to ASCII 0–9.
    private static string NormalizeDigits(string input) =>
        string.IsNullOrEmpty(input)
            ? input
            : new string(
                input
                    .Select(ch =>
                        ch is >= '۰' and <= '۹' ? (char)('0' + (ch - '۰'))
                        : ch is >= '٠' and <= '٩' ? (char)('0' + (ch - '٠'))
                        : ch
                    )
                    .ToArray()
            );
}
