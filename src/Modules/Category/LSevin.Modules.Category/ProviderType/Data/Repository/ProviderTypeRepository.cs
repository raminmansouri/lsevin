using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using Sieve.Services;
using ProviderTypeDomain = LSevin.Modules.Category.ProviderType.Entities.ProviderType;

namespace LSevin.Modules.Category.ProviderType.Data.Repository;

internal sealed class ProviderTypeRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<ProviderTypeDomain, ProviderTypeId>(dbContext, SpecificationBaseEvaluator.Instance, sieveProcessor),
        IProviderTypeRepository;
