using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Modules.Customer.Customer.Dtos;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomerUserIdentityBaseInfo;

internal sealed record UpdateCustomerUserIdentityBaseInfoCommand(
    Guid UserId,
    string FirstName,
    string LastName,
    string PhoneNumber,
    string PhoneNumberCountryCode,
    string Email
) : InternalCommand, ICustomerUserIdentityBaseInfo;
