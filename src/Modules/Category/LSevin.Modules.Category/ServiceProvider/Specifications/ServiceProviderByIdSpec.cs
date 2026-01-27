using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Specifications;

public sealed class ServiceProviderByIdSpec(ServiceProviderId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<Entities.ServiceProvider, ServiceProviderId>(id, isReadOnly);
