using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Customer.Consulting.ValueObjects;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Consulting.Specifications;

public sealed class ConsultingSelectedDocumentByDocumentIdSpec : SpecificationBase<Entities.Consulting, ConsultingId>
{
    public ConsultingSelectedDocumentByDocumentIdSpec(CustomerDocumentId documentId)
    {
        Query.Where(c => c.Documents.Any(d => d.CustomerDocumentId == documentId));
    }
}
