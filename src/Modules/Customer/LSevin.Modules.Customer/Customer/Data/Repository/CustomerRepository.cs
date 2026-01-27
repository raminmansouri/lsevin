using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Customer.Customer.ValueObjects;
using LSevin.Modules.Customer.Infrastructure.Data.Context;
using Sieve.Services;

namespace LSevin.Modules.Customer.Customer.Data.Repository;

internal sealed class CustomerRepository(CustomerContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<Entities.Customer, CustomerId>(dbContext, SpecificationBaseEvaluator.Instance, sieveProcessor),
        ICustomerRepository;
