namespace LSevin.Modules.Identity.Identity.Features.VerifyOtp;

internal sealed record VerifyOtpRequest(string Code, string PhoneNumber);
