using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using Sieve.Services;
using System.Data;

namespace LSevin.Modules.Category.ServiceProvider.Data.Repository;

internal sealed class ServiceProviderRepository(CategoryContext dbContext,
    ISieveProcessor sieveProcessor)
    : Repository<Entities.ServiceProvider, ServiceProviderId>(
        dbContext,
        SpecificationBaseEvaluator.Instance,
        sieveProcessor
    ),
        IServiceProviderRepository;

