using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomer;

internal sealed record UpdateCustomerRequest(DateTime BirthDate, AddressDto Address, int Gender);
