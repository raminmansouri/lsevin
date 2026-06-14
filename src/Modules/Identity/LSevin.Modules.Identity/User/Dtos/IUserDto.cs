namespace LSevin.Modules.Identity.User.Dtos;

internal interface IUserDto
{
    string FirstName { get; }
    string LastName { get; }
    string UserName { get; }
    string PhoneNumber { get; }
    string PhoneNumberCountryCode { get; }
    string Email { get; }
}
