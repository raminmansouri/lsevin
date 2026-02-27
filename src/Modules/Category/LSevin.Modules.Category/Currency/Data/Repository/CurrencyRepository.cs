using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using Sieve.Services;

namespace LSevin.Modules.Category.Category.Data.Repository;

internal sealed class CurrencyRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<Currency.Entities.Currency, CurrencyId>(dbContext, SpecificationBaseEvaluator.Instance, sieveProcessor),
        ICurrencyRepository;
