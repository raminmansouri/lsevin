using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ProviderType.Specifications;

public sealed class ProviderAttributeDefinitionByIdSpec
    : SpecificationBase<ProviderTypeDomain, ProviderTypeId>,
        ISingleResultSpecification<ProviderTypeDomain>
{
    public ProviderAttributeDefinitionByIdSpec(ProviderAttributeDefinitionId id, bool isReadOnly = false)
    {
        Query
            .Include(pt => pt.AttributeDefinitions.Where(ad => ad.Id == id))
            .Where(pt => pt.AttributeDefinitions.Any(ad => ad.Id == id))
            .AsNoTracking(isReadOnly);
    }
}
