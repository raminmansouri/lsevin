using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Specifications;

public sealed class ServiceDefinitionByIdSpec(ServiceDefinitionId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<ServiceDefinitionDomain, ServiceDefinitionId>(id, isReadOnly);
