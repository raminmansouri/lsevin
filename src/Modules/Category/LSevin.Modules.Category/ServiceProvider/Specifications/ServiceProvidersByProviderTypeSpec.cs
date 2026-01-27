using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Specifications;

public sealed class ServiceProvidersByProviderTypeSpec : SpecificationBase<Entities.ServiceProvider, ServiceProviderId>
{
    public ServiceProvidersByProviderTypeSpec(
        ProviderTypeId providerTypeId,
        bool includeInactive = false,
        bool isReadOnly = false
    )
    {
        var query = Query.Where(sp => sp.ProviderTypeId == providerTypeId);

        if (!includeInactive)
        {
            query = query.Where(sp => sp.IsActive);
        }

        query.AsNoTracking(isReadOnly);
    }
}
