using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Customer.Customer.ValueObjects;
using CustomerDomain = LSevin.Modules.Customer.Customer.Entities.Customer;

namespace LSevin.Modules.Customer.Customer.Specifications;

public sealed class CustomerByIdSpec(CustomerId id, bool isReadOnly = false)
    : AggregateRootByIdSpec<CustomerDomain, CustomerId>(id, isReadOnly);
