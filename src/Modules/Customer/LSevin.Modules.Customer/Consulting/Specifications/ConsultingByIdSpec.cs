using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Customer.Consulting.ValueObjects;
using ConsultingDomain = LSevin.Modules.Customer.Consulting.Entities.Consulting;

namespace LSevin.Modules.Customer.Consulting.Specifications;

public sealed class ConsultingByIdSpec(ConsultingId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<ConsultingDomain, ConsultingId>(id, isReadOnly);
