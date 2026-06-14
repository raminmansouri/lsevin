using Ardalis.Specification;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProviderComment.Specifications;

public sealed class CommentsByServiceProviderSpec : Specification<Entities.ServiceProviderComment>
{
    public CommentsByServiceProviderSpec(ServiceProviderId serviceProviderId, bool publicOnly = true)
    {
        Query.Where(c => c.ServiceProviderId == serviceProviderId);

        if (publicOnly)
        {
            Query.Where(c => c.IsPublic);
        }

        Query.OrderByDescending(c => c.CreateDate);
    }
}
