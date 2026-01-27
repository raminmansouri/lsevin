namespace LSevin.Modules.Identity.User.Features.RegisterUser;

internal sealed record RegisterUserRequest(
    string FirstName,
    string LastName,
    string UserName,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    string Password,
    string ConfirmPassword
);
