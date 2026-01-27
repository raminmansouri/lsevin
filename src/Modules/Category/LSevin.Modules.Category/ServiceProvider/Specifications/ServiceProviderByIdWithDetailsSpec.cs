using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Specifications;

public sealed class ServiceProviderByIdWithDetailsSpec
    : SpecificationBase<Entities.ServiceProvider, ServiceProviderId>,
        ISingleResultSpecification<Entities.ServiceProvider>
{
    public ServiceProviderByIdWithDetailsSpec(ServiceProviderId id, bool isReadOnly = false)
    {
        Query
            .Where(s => s.Id == id)
            .Include(s => s.Attributes)
            .Include(s => s.Services)
            .ThenInclude(s => s.AttributeValues)
            .Include(s => s.GalleryItems)
            .Include(s => s.Policies)
            .Include(s => s.StaffMembers)
            .AsSplitQuery()
            .AsNoTracking(isReadOnly);
    }
}
