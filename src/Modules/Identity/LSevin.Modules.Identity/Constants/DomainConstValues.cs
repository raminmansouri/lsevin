using BuildingBlocks.Core.Persistence;

namespace LSevin.Modules.Identity.Constants;

/// <summary>
/// Static class containing domain constants.
/// </summary>
internal static class DomainConstValues
{
    internal const int TokenMaxLength = EfConstants.Lenght.UltraLong;
    internal const int AccessTokenIpMaxLength = EfConstants.Lenght.Normal;

    public const int ApplicationUserNameMaxLength = EfConstants.Lenght.Normal;
    public const int ApplicationUserNameNormalizedNameMaxLength = EfConstants.Lenght.Normal;

    public const int EmailVerificationCodeMaxLength = 6;
    public const int PasswordResetCodeMaxLength = 6;

    public const int PhoneLoginCodeMaxLength = 6;
    public const int PhoneLoginCodeExpirationMinutes = 5;
    public const int MaxPhoneLoginCodeVerifyAttempts = 5;
    public const int MaxPhoneLoginCodeResendAttempts = 3;

    public const int RefreshTokenMaxLength = EfConstants.Lenght.Medium;
}
