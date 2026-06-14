using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ProviderType.Specifications;

public sealed class ProviderTypeByIdAndDetailsSpec
    : SpecificationBase<ProviderTypeDomain, ProviderTypeId>,
        ISingleResultSpecification<ProviderTypeDomain>
{
    public ProviderTypeByIdAndDetailsSpec(ProviderTypeId id, bool isReadOnly = false)
    {
        Query.Where(aggregate => aggregate.Id == id).Include(pt => pt.AttributeDefinitions).AsNoTracking(isReadOnly);
    }
}
