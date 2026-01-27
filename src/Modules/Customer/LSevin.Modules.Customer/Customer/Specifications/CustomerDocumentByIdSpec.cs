using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Customer.Customer.ValueObjects;
using CustomerDomain = LSevin.Modules.Customer.Customer.Entities.Customer;

namespace LSevin.Modules.Customer.Customer.Specifications;

public class CustomerDocumentByIdSpec : SpecificationBase<CustomerDomain, CustomerId>
{
    public CustomerDocumentByIdSpec(CustomerId customerId, CustomerDocumentId documentId, bool isReadOnly = false)
    {
        Query
            .Include(c => c.Documents.Where(d => d.Id == documentId))
            .Where(c => c.Documents.Any(d => d.Id == documentId))
            .Where(c => c.Id == customerId)
            .AsNoTracking(isReadOnly);
    }
}
