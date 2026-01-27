using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.Category.ValueObjects;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Data.Repository;

public interface ICategoryRepository : IRepository<CategoryDomain, CategoryId>;
