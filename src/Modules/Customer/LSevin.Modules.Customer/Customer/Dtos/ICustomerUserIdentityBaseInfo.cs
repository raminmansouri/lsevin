namespace LSevin.Modules.Customer.Customer.Dtos;

internal interface ICustomerUserIdentityBaseInfo
{
    Guid UserId { get; }
    string FirstName { get; }
    string LastName { get; }
    string PhoneNumber { get; }
    string PhoneNumberCountryCode { get; }
    string Email { get; }
}
