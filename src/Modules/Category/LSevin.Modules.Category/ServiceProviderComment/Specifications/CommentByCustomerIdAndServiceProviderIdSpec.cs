using Ardalis.Specification;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProviderComment.Specifications;

public sealed class CommentByCustomerIdAndServiceProviderIdSpec : Specification<Entities.ServiceProviderComment>
{
    public CommentByCustomerIdAndServiceProviderIdSpec(Guid customerId, ServiceProviderId serviceProviderId)
    {
        Query
            .Where(c => c.CustomerId == customerId && c.ServiceProviderId == serviceProviderId)
            .OrderByDescending(c => c.CreateDate);
    }
}
