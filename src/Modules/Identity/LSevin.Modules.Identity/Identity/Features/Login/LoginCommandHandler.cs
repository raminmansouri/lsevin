using Ardalis.GuardClauses;
using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Services;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using LSevin.Modules.Identity.Resources;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LSevin.Modules.Identity.Identity.Features.Login;

internal sealed class LoginCommandHandler(
    IdentityContext context,
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IOtpCodeGeneratorService otpGenerator,
    IOtpSenderService otpSender,
    ILogger<LoginCommandHandler> logger
) : CommandHandler<LoginCommand, LoginResponse>
{
    public override async Task<Result<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        Guard.Against.Null(request, nameof(LoginCommand));

        var identityUser =
            await userManager.FindUserWithRoleByPhoneNumberAsync(
                request.UserNameOrEmail,
                cancellationToken: cancellationToken
            ) ?? await userManager.FindByEmailAsync(request.UserNameOrEmail);

        if (identityUser is null or { Email: null or "", UserName: null or "" })
            return AppError.NotFoundErrorMessage(SharedResource.Username);

        var signinResult = await signInManager.CheckPasswordSignInAsync(
            identityUser,
            request.Password,
            lockoutOnFailure: false
        );

        if (signinResult.IsNotAllowed)
        {
            if (!await userManager.IsEmailConfirmedAsync(identityUser))
            {
                return AppError.ApplicationErrorMessage(
                    IdentityResource.Not_Confirmed_Error_Message.FormatWithStr(SharedResource.Email)
                );
            }

            if (!await userManager.IsPhoneNumberConfirmedAsync(identityUser))
            {
                return AppError.ApplicationErrorMessage(
                    IdentityResource.Not_Confirmed_Error_Message.FormatWithStr(SharedResource.Phone_Number)
                );
            }
        }

        if (signinResult.IsLockedOut)
        {
            return AppError.ApplicationErrorMessage(IdentityResource.User_Locked_Error_Message);
        }

        if (signinResult.RequiresTwoFactor)
        {
            return AppError.ApplicationErrorMessage(IdentityResource.Requires_Two_Factor_Error_Message);
        }

        if (!signinResult.Succeeded)
        {
            return AppError.ApplicationErrorMessage(IdentityResource.Invalid_Credentials_Error_Message);
        }

        // ===== NEW 2FA FLOW STARTS HERE =====

        // 1. Check user has phone number
        if (string.IsNullOrEmpty(identityUser.PhoneNumber) || string.IsNullOrEmpty(identityUser.PhoneNumberCountryCode))
        {
            return AppError.ApplicationErrorMessage("Phone number required for two-factor authentication.");
        }

        // 2. Invalidate existing OTP codes for this user
        var existingCodes = await context
            .PhoneLoginCodes.Where(c => c.UserId == identityUser.Id && !c.IsInvalidated && c.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var code in existingCodes)
        {
            code.Invalidate();
        }

        // 3. Generate new OTP code
        var otpCode = otpGenerator.GenerateCode();
        var sentAt = SystemClock.Now;
        var expiresAt = otpGenerator.CalculateExpiration(sentAt);

        // 3a. Create PhoneNumber value object
        var phoneNumber = PhoneNumber.Create(identityUser.PhoneNumber, identityUser.PhoneNumberCountryCode);

        // 4. Save OTP to database
        var phoneLoginCode = new PhoneLoginCode
        {
            Id = IdGenerator.NewId(),
            UserId = identityUser.Id,
            PhoneNumber = phoneNumber,
            Code = otpCode,
            SentAt = sentAt,
            ExpiresAt = expiresAt,
            AttemptCount = 0,
            IsInvalidated = false,
        };

        await context.PhoneLoginCodes.AddAsync(phoneLoginCode, cancellationToken);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }catch(Exception e)
        {
            throw e;
        }

        // 5. Send OTP via SMS/WhatsApp
        var sendResult = await otpSender.SendOtpCodeAsync(phoneNumber, otpCode, cancellationToken);

        if (!sendResult.IsSuccess)
        {
            logger.LogError("Failed to send OTP to user {UserId}", identityUser.Id);
            return AppError.ApplicationErrorMessage("Failed to send verification code. Please try again.");
        }

        logger.LogInformation("OTP sent to user {UserId}", identityUser.Id);

        // 6. Format phone number to E.164 format for response
        var formattedPhoneNumber = phoneNumber.ToE164Format();

        // 7. Return intermediate response (NO TOKENS YET)
        return LoginResponse.RequireOtpVerification(expiresAt, formattedPhoneNumber);
    }
}
