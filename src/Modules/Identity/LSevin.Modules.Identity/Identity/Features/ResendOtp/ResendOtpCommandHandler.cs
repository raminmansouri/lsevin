using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Services;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Identity.Features.ResendOtp;

internal sealed class ResendOtpCommandHandler(
    IdentityContext context,
    UserManager<ApplicationUser> userManager,
    IOtpCodeGeneratorService otpGenerator,
    IOtpSenderService otpSender,
    IOtpCodeValidatorService otpValidator
) : CommandHandler<ResendOtpCommand, ResendOtpResponse>
{
    public override async Task<Result<ResendOtpResponse>> Handle(
        ResendOtpCommand command,
        CancellationToken cancellationToken
    )
    {
        // 2. Find user by phone number
        var user = await userManager.FindUserWithRoleByPhoneNumberAsync(
            command.PhoneNumber,
            cancellationToken: cancellationToken
        );

        if (user == null)
            return AppError.NotFoundErrorMessage(SharedResource.User);

        // 3. Check user has phone number
        if (string.IsNullOrEmpty(user.PhoneNumber) || string.IsNullOrEmpty(user.PhoneNumberCountryCode))
            return AppError.ApplicationErrorMessage("Phone number is required to resend OTP.");

        // 4. Create PhoneNumber value object from user data
        var phoneNumber = PhoneNumber.Create(user.PhoneNumber, user.PhoneNumberCountryCode);

        // 5. Invalidate existing codes for this phone number
        var existingCodes = await context
            .PhoneLoginCodes.Where(c =>
                c.PhoneNumber.Value == phoneNumber.Value
                && c.PhoneNumber.CountryCode == phoneNumber.CountryCode
                && !c.IsInvalidated
                && c.UsedAt == null
            )
            .ToListAsync(cancellationToken);

        otpValidator.InvalidateExistingCodes(existingCodes);

        // 6. Check resend limit (more strict for resend)
        var recentCount = await context.PhoneLoginCodes.CountAsync(
            c => c.UserId == user.Id && c.SentAt > SystemClock.Now.AddMinutes(-10),
            cancellationToken
        );

        var canResend = otpValidator.CanResendCode(user.Id, recentCount);
        if (!canResend.IsSuccess)
        {
            return AppError.ApplicationErrorMessage("Too many resend attempts. Please try again later.");
        }

        // 7. Generate OTP code
        var code = otpGenerator.GenerateCode();
        var sentAt = SystemClock.Now;
        var expiresAt = otpGenerator.CalculateExpiration(sentAt);

        // 8. Save to database
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

        // 9. Send via SMS/WhatsApp
        var sendResult = await otpSender.SendOtpCodeAsync(phoneNumber, code, cancellationToken);
        if (!sendResult.IsSuccess)
            return sendResult.Errors!.First();

        // 10. Format phone number to E.164 format for response
        var formattedPhoneNumber = phoneNumber.ToE164Format();

        // 11. Return response
        return new ResendOtpResponse(PhoneNumber: formattedPhoneNumber, ExpiresAt: expiresAt);
    }
}
