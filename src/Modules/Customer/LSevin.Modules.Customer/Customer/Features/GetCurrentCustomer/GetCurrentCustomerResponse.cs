using BuildingBlocks.Core.Generators;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Customer.Customer.Features.GetCurrentCustomer;

public sealed record GetCurrentCustomerResponse(
    Guid CustomerId,
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    DateTime? BirthDate,
    string? Gender,
    AddressDto? Address
)
{
    private GetCurrentCustomerResponse()
        : this(
            IdGenerator.EmptyId,
            FirstName: string.Empty,
            LastName: string.Empty,
            Email: string.Empty,
            PhoneNumberCountryCode: string.Empty,
            PhoneNumber: string.Empty,
            BirthDate: null,
            Gender: string.Empty,
            Address: null
        ) { }
}
