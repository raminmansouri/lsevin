namespace LSevin.Modules.Identity.Identity.Features.VerifyOtp;

public sealed record VerifyOtpResponse(
    Guid UserId,
    string FirstName,
    string LastName,
    string Username,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    DateTime? LastLoggedInAt,
    IReadOnlyList<string> Roles,
    int UserState,
    DateTime CreatedAt,
    string AccessToken,
    string RefreshToken
);
