using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceRequest.ValueObjects;
using Sieve.Services;

namespace LSevin.Modules.Category.ServiceRequest.Data.Repository;

internal sealed class ServiceProviderRequestRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<Entities.ServiceProviderRequest, ServiceProviderRequestId>(
        dbContext,
        SpecificationBaseEvaluator.Instance,
        sieveProcessor
    ),
        IServiceProviderRequestRepository;
