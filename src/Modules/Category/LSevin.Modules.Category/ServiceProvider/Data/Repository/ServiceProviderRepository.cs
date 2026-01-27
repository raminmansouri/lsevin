using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using Sieve.Services;

namespace LSevin.Modules.Category.ServiceProvider.Data.Repository;

internal sealed class ServiceProviderRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<Entities.ServiceProvider, ServiceProviderId>(
        dbContext,
        SpecificationBaseEvaluator.Instance,
        sieveProcessor
    ),
        IServiceProviderRepository;
