namespace LSevin.Modules.Identity.User.Features.UpdateUser;

internal sealed record UpdateUserRequest(
    string FirstName,
    string LastName,
    string UserName,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber
);
