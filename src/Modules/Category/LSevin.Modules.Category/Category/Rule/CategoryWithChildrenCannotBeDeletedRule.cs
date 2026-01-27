using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Resources;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Rule;

public sealed class CategoryWithChildrenCannotBeDeletedRule(IReadOnlyCollection<CategoryDomain> children)
    : IBusinessRule
{
    public bool IsBroken() => children.Count > 0;

    public string Message => CategoryResource.Category_With_Children_Cannot_Be_Deleted_Error_Message;
}
