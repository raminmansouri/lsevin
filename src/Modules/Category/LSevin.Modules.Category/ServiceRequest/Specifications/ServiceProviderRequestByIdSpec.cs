using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.ServiceRequest.ValueObjects;

namespace LSevin.Modules.Category.ServiceRequest.Specifications;

public sealed class ServiceProviderRequestByIdSpec(ServiceProviderRequestId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<Entities.ServiceProviderRequest, ServiceProviderRequestId>(id, isReadOnly);
