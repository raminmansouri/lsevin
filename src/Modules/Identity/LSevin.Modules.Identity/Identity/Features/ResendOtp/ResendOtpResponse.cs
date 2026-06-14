namespace LSevin.Modules.Identity.Identity.Features.ResendOtp;

public sealed record ResendOtpResponse(string PhoneNumber, DateTime ExpiresAt);
