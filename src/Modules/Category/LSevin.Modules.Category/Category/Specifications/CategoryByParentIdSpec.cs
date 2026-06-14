using Ardalis.Specification;
using LSevin.Modules.Category.Category.ValueObjects;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Specifications;

public sealed class CategoryByParentIdSpec : Specification<CategoryDomain>
{
    public CategoryByParentIdSpec(CategoryId? parentId, bool isReadOnly = false)
    {
        Query.Where(c => c.ParentId == parentId).OrderBy(c => c.DisplayOrder).AsNoTracking(isReadOnly);
    }
}
