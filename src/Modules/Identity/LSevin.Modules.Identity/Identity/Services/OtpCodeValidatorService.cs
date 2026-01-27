using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.Identity.Entities;

namespace LSevin.Modules.Identity.Identity.Services;

internal sealed class OtpCodeValidatorService : IOtpCodeValidatorService
{
    public Result<PhoneLoginCode> ValidateCode(Guid userId, string code, out PhoneLoginCode? phoneLoginCode)
    {
        phoneLoginCode = null;

        if (string.IsNullOrWhiteSpace(code))
        {
            return AppError.ApplicationErrorMessage("OTP Code", "OTP code is required");
        }

        if (code.Length != DomainConstValues.PhoneLoginCodeMaxLength)
        {
            return AppError.ApplicationErrorMessage(
                "OTP Code",
                $"OTP code must be {DomainConstValues.PhoneLoginCodeMaxLength} digits"
            );
        }

        if (!code.All(char.IsDigit))
        {
            return AppError.ApplicationErrorMessage("OTP Code", "OTP code must contain only digits");
        }

        return phoneLoginCode;
    }

    public Result<bool> CanResendCode(Guid userId, int recentCodesCount)
    {
        if (recentCodesCount >= DomainConstValues.MaxPhoneLoginCodeResendAttempts)
        {
            return AppError.ApplicationErrorMessage(
                nameof(PhoneLoginCode),
                $"Maximum resend attempts ({DomainConstValues.MaxPhoneLoginCodeResendAttempts}) exceeded. Please try again later."
            );
        }

        return true;
    }

    public void InvalidateExistingCodes(IEnumerable<PhoneLoginCode> existingCodes)
    {
        foreach (var code in existingCodes)
        {
            if (code.CanBeVerified())
            {
                code.Invalidate();
            }
        }
    }
}
