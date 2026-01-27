using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using Sieve.Services;

namespace LSevin.Modules.Category.Category.Data.Repository;

internal sealed class CategoryRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<Entities.Category, CategoryId>(dbContext, SpecificationBaseEvaluator.Instance, sieveProcessor),
        ICategoryRepository;
