using System.Security.Cryptography;
using Ardalis.GuardClauses;
using LSevin.Modules.Identity.Constants;

namespace LSevin.Modules.Identity.Identity.Services;

/// <summary>
/// Implementation of OTP code generation using cryptographically secure random numbers.
/// </summary>
internal sealed class OtpCodeGeneratorService : IOtpCodeGeneratorService
{
    public string GenerateCode(int length = DomainConstValues.PhoneLoginCodeMaxLength)
    {
        Guard.Against.Negative(length, nameof(length));

        // Use RandomNumberGenerator for cryptographically secure random numbers
        var maxValue = (int)Math.Pow(10, length);

        // Generate random number between 0 and 999999 (for 6 digits)
        var randomNumber = RandomNumberGenerator.GetInt32(0, maxValue);

        // Format with leading zeros
        var codeString = randomNumber.ToString($"D{length}");

        return codeString;
    }

    public DateTime CalculateExpiration(
        DateTime sentAt,
        int expirationMinutes = DomainConstValues.PhoneLoginCodeExpirationMinutes
    )
    {
        Guard.Against.Negative(expirationMinutes, nameof(expirationMinutes));

        return sentAt.AddMinutes(expirationMinutes);
    }
}
