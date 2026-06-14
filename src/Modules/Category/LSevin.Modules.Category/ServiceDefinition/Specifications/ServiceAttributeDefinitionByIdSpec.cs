using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Specifications;

public sealed class ServiceAttributeDefinitionByIdSpec
    : SpecificationBase<ServiceDefinitionDomain, ServiceDefinitionId>,
        ISingleResultSpecification<ServiceDefinitionDomain>
{
    public ServiceAttributeDefinitionByIdSpec(ServiceAttributeDefinitionId id, bool isReadOnly = false)
    {
        Query
            .Include(sd => sd.AttributeDefinitions.Where(ad => ad.Id == id))
            .Where(sd => sd.AttributeDefinitions.Any(ad => ad.Id == id))
            .AsNoTracking(isReadOnly);
    }
}
