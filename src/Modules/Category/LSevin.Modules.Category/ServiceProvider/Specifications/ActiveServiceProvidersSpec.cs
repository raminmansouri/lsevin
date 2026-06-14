using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Specifications;

public sealed class ActiveServiceProvidersSpec : SpecificationBase<Entities.ServiceProvider, ServiceProviderId>
{
    public ActiveServiceProvidersSpec(bool isReadOnly = false)
    {
        Query.Where(s => s.IsActive).AsNoTracking(isReadOnly);
    }
}
