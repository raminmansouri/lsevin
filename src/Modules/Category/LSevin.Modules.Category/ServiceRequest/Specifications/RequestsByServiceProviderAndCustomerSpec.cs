using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using LSevin.Modules.Category.ServiceRequest.ValueObjects;

namespace LSevin.Modules.Category.ServiceRequest.Specifications;

public sealed class RequestsByServiceProviderAndCustomerSpec
    : SpecificationBase<Entities.ServiceProviderRequest, ServiceProviderRequestId>
{
    public RequestsByServiceProviderAndCustomerSpec(
        ServiceProviderId serviceProviderId,
        Guid customerId,
        bool isReadOnly = false
    )
    {
        Query
            .Where(r => r.ServiceProviderId == serviceProviderId && r.CustomerId == customerId)
            .AsNoTracking(isReadOnly);
    }
}
