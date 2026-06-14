using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Rule;

public sealed class CategoryCannotBeItsOwnParentRule(CategoryId categoryId, CategoryId parentId) : IBusinessRule
{
    public bool IsBroken() => categoryId == parentId;

    public string Message => CategoryResource.Category_Cannot_Be_Its_Own_Parent_Error_Message;
}
