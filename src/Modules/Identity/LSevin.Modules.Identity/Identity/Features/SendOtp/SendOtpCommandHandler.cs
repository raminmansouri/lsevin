using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Services;
using LSevin.Modules.Identity.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Modules.Identity.Identity.Features.SendOtp;

internal sealed class SendOtpCommandHandler(
    IdentityContext context,
    IUserAccessor userAccessor,
    IOtpCodeGeneratorService otpGenerator,
    IOtpSenderService otpSender,
    IOtpCodeValidatorService otpValidator,
    IOtpBypassService otpBypass
) : CommandHandler<SendOtpCommand, SendOtpResponse>
{
    public override async Task<Result<SendOtpResponse>> Handle(
        SendOtpCommand command,
        CancellationToken cancellationToken
    )
    {
        var userId = userAccessor.GetUserIdentity;
        // 1. Find user by ID
        var user = await context.Users.FindAsync([userId], cancellationToken);
        if (user == null)
            return AppError.NotFoundErrorMessage(SharedResource.User);

        // 2. Check user has phone number
        if (string.IsNullOrEmpty(user.PhoneNumber) || string.IsNullOrEmpty(user.PhoneNumberCountryCode))
            return AppError.ApplicationErrorMessage("Phone number is required to send OTP.");

        // 3. Invalidate existing codes
        var existingCodes = await context
            .PhoneLoginCodes.Where(c => c.UserId == userId && !c.IsInvalidated && c.UsedAt == null)
            .ToListAsync(cancellationToken);

        otpValidator.InvalidateExistingCodes(existingCodes);

        // 4. Check resend limit
        var recentCount = await context.PhoneLoginCodes.CountAsync(
            c => c.UserId == userId && c.SentAt > SystemClock.Now.AddMinutes(-10),
            cancellationToken
        );

        var canResend = otpValidator.CanResendCode(userId, recentCount);
        if (!canResend.IsSuccess)
            return canResend.Errors!.First();

        // 5. Create PhoneNumber value object
        var phoneNumber = PhoneNumber.Create(user.PhoneNumber, user.PhoneNumberCountryCode);

        // 6. Generate OTP code (fixed code for configured review/test phone numbers)
        var isBypass = otpBypass.TryGetFixedCode(phoneNumber, out var bypassCode);
        var code = isBypass ? bypassCode! : otpGenerator.GenerateCode();
        var sentAt = SystemClock.Now;
        var expiresAt = otpGenerator.CalculateExpiration(sentAt);

        // 7. Save to database
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

        // 8. Send via SMS/WhatsApp (skipped for the fixed-code review/test bypass)
        if (!isBypass)
        {
            var sendResult = await otpSender.SendOtpCodeAsync(phoneNumber, code, cancellationToken);
            if (!sendResult.IsSuccess)
                return sendResult.Errors!.First();
        }

        // 9. Format phone number to E.164 format for response
        var formattedPhoneNumber = phoneNumber.ToE164Format();

        // 10. Return response
        return new SendOtpResponse(PhoneNumber: formattedPhoneNumber, ExpiresAt: expiresAt);
    }
}
