using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Services;

public interface ICustomerUniquenessCheckerService : IDomainService
{
    Result<bool> IsUnique(Email email, CustomerId? customerId = null);

    Result<bool> IsUnique(PhoneNumber phoneNumber, CustomerId? customerId = null);
}
