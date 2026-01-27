namespace LSevin.Modules.Identity.Identity.Features.SendOtp;

public sealed record SendOtpResponse(string PhoneNumber, DateTime ExpiresAt);
