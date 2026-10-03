namespace LSevin.Modules.Identity.Identity.Services;

/// <summary>
/// Configuration allowing specific phone numbers (e.g. Google Play / App Store review accounts)
/// to log in with a fixed OTP code instead of a real SMS/WhatsApp message.
/// </summary>
public sealed class OtpBypassOptions
{
    public bool Enabled { get; init; }

    public string Code { get; init; } = string.Empty;

    public List<OtpBypassPhoneNumber> PhoneNumbers { get; init; } = [];
}

public sealed class OtpBypassPhoneNumber
{
    public string Value { get; init; } = string.Empty;

    public string CountryCode { get; init; } = string.Empty;
}
