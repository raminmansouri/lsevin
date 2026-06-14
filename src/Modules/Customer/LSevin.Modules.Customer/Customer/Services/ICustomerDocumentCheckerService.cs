using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Services;

public interface ICustomerDocumentCheckerService : IDomainService
{
    Result<bool> ContainsAll(CustomerId customerId, IReadOnlyCollection<CustomerDocumentId> documentIds);
}
