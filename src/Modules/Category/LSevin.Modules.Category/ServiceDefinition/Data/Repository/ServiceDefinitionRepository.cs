using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using Sieve.Services;
using ServiceDefinitionDomain = LSevin.Modules.Category.ServiceDefinition.Entities.ServiceDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Data.Repository;

internal sealed class ServiceDefinitionRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<ServiceDefinitionDomain, ServiceDefinitionId>(
        dbContext,
        SpecificationBaseEvaluator.Instance,
        sieveProcessor
    ),
        IServiceDefinitionRepository;
