using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak;
using LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus;
using Microsoft.Extensions.Logging;

namespace LSevin.Modules.Identity.Identity.Services;

internal sealed class OtpSenderService(
    IMeliPayamakApiClient meliPayamakClient,
    IWhatsplusApiClient whatsplusClient,
    ILogger<OtpSenderService> logger
) : IOtpSenderService
{
    public Task<Result> SendOtpCodeAsync(
        PhoneNumber phoneNumber,
        string otpCode,
        CancellationToken cancellationToken = default
    )
    {
        logger.LogInformation("[OtpSender] - Routing OTP for country: {CountryCode}", phoneNumber.CountryCode);

        // Format phone number to E.164 format (e.g., +989123456789 or +12345678901)
        var formattedPhoneNumber = phoneNumber.ToE164Format();

        // Route based on country code
        if (phoneNumber.CountryCode.Equals("IR", StringComparison.OrdinalIgnoreCase))
        {
            return SendViaMeliPayamakAsync(formattedPhoneNumber, otpCode, cancellationToken);
        }

        return SendViaWhatsAppAsync(formattedPhoneNumber, otpCode, cancellationToken);
    }

    private async Task<Result> SendViaMeliPayamakAsync(
        string phoneNumber,
        string otpCode,
        CancellationToken cancellationToken
    )
    {
        logger.LogInformation("[OtpSender] - Using MeliPayamak for Iranian number");

        // For pattern mode (SendByBaseNumber2), send only the variables separated by semicolons
        // The pattern must be defined in Melipayamak panel with placeholders like {0} etc.
        // Example pattern: "کد تایید شما: {0}"
        // This will send: "{otpCode}" where:
        //   - {0} = otpCode
        // Reference: https://www.melipayamak.com/blog/posts/sms-with-pattern-mode/
        var patternVariables = $"{otpCode}";

        var result = await meliPayamakClient.SendSmsAsync(phoneNumber, patternVariables, cancellationToken);

        if (!result.IsSuccess)
        {
            return AppError.ApplicationErrorMessage("OTP Sender", "Failed to send SMS via MeliPayamak");
        }

        return Result.Success();
    }

    private Task<Result> SendViaWhatsAppAsync(string phoneNumber, string otpCode, CancellationToken cancellationToken)
    {
        logger.LogInformation("[OtpSender] - Using WhatsApp for international number");

        var message = $"Your verification code: {otpCode}\nValid for 1 minutes";
        return whatsplusClient.SendWhatsAppMessageAsync(phoneNumber, message, cancellationToken);
    }
}
