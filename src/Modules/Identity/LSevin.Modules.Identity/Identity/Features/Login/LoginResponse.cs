namespace LSevin.Modules.Identity.Identity.Features.Login;

public sealed record LoginResponse
{
    public bool RequiresOtp { get; init; }

    public DateTime? OtpExpiresAt { get; init; }

    public string? PhoneNumber { get; init; }

    public Guid? UserId { get; init; }

    public string? FirstName { get; init; }

    public string? LastName { get; init; }

    public string? Username { get; init; }

    public string? AccessToken { get; init; }

    public string? RefreshToken { get; init; }

    public static LoginResponse RequireOtpVerification(DateTime otpExpiresAt, string phoneNumber) =>
        new()
        {
            RequiresOtp = true,
            OtpExpiresAt = otpExpiresAt,
            PhoneNumber = phoneNumber,
        };

    public static LoginResponse LoginComplete(
        Guid userId,
        string firstName,
        string lastName,
        string username,
        string accessToken,
        string refreshToken
    ) =>
        new()
        {
            RequiresOtp = false,
            UserId = userId,
            FirstName = firstName,
            LastName = lastName,
            Username = username,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
        };
}
