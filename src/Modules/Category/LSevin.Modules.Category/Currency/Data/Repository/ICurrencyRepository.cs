using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.Category.ValueObjects;
using CategoryDomain = LSevin.Modules.Category.Currency.Entities.Currency;

namespace LSevin.Modules.Category.Category.Data.Repository;

public interface ICurrencyRepository : IRepository<CategoryDomain, CurrencyId>;
