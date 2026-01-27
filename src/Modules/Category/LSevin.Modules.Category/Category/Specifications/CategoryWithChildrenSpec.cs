using Ardalis.Specification;
using BuildingBlocks.Core.Domain.Specification;
using LSevin.Modules.Category.Category.ValueObjects;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Specifications;

public sealed class CategoryWithChildrenSpec : SpecificationBase<CategoryDomain, CategoryId>
{
    public CategoryWithChildrenSpec(CategoryId categoryId, bool isReadOnly = false)
    {
        Query.Where(c => c.Id == categoryId).Include(c => c.Children).AsNoTracking(isReadOnly);
    }
}
