using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Specifications;

public sealed class ServiceDefinitionByIdAndDetailsSpec
    : SpecificationBase<ServiceDefinitionDomain, ServiceDefinitionId>,
        ISingleResultSpecification<ServiceDefinitionDomain>
{
    public ServiceDefinitionByIdAndDetailsSpec(ServiceDefinitionId id, bool isReadOnly = false)
    {
        Query
            .Where(aggregate => aggregate.Id == id)
            .Include(sd => sd.Requirements)
            .Include(sd => sd.AttributeDefinitions)
            .AsNoTracking(isReadOnly);
    }
}
