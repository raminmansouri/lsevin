using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Services;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LSevin.Modules.Identity.Identity.Features.ForgotPassword;

internal sealed class ForgotPasswordCommandHandler(
    IdentityContext context,
    UserManager<ApplicationUser> userManager,
    IOtpCodeGeneratorService otpGenerator,
    IOtpSenderService otpSender,
    ILogger<ForgotPasswordCommandHandler> logger
) : CommandHandler<ForgotPasswordCommand, ForgotPasswordResponse>
{
    // Generic response so the endpoint never reveals whether an account exists (prevents enumeration).
    private static readonly ForgotPasswordResponse GenericResponse = new(
        "If an account matches, a password reset code has been sent."
    );

    public override async Task<Result<ForgotPasswordResponse>> Handle(
        ForgotPasswordCommand command,
        CancellationToken cancellationToken
    )
    {
        // Accept either a phone number (E.164) or an email, mirroring the login lookup.
        var user =
            await userManager.FindUserWithRoleByPhoneNumberAsync(
                command.UserNameOrEmail,
                cancellationToken: cancellationToken
            ) ?? await userManager.FindByEmailAsync(command.UserNameOrEmail);

        // Reset codes are delivered over SMS, so the user must have a phone number (and an email key).
        if (
            user is null
            || string.IsNullOrEmpty(user.Email)
            || string.IsNullOrEmpty(user.PhoneNumber)
            || string.IsNullOrEmpty(user.PhoneNumberCountryCode)
        )
        {
            logger.LogInformation("[ForgotPassword] - No SMS-deliverable account for the supplied identifier.");
            return GenericResponse;
        }

        var resetCodes = context.Set<PasswordResetCode>();
        var now = SystemClock.Now;
        var code = otpGenerator.GenerateCode(DomainConstValues.PasswordResetCodeMaxLength);

        // Invalidate any still-active codes for this account before issuing a new one.
        var activeCodes = await resetCodes
            .Where(c => c.Email == user.Email && c.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var existing in activeCodes)
        {
            existing.UsedAt = now;
        }

        await resetCodes.AddAsync(
            new PasswordResetCode
            {
                Id = IdGenerator.NewId(),
                Email = user.Email,
                Code = code,
                SentAt = now,
            },
            cancellationToken
        );

        await context.SaveChangesAsync(cancellationToken);

        var phoneNumber = PhoneNumber.Create(user.PhoneNumber, user.PhoneNumberCountryCode);
        var sendResult = await otpSender.SendOtpCodeAsync(phoneNumber, code, cancellationToken);

        if (!sendResult.IsSuccess)
        {
            logger.LogError("[ForgotPassword] - Failed to send reset code to user {UserId}", user.Id);
            return AppError.ApplicationErrorMessage("Failed to send the reset code. Please try again.");
        }

        logger.LogInformation("[ForgotPassword] - Reset code sent to user {UserId}", user.Id);

        return GenericResponse;
    }
}
