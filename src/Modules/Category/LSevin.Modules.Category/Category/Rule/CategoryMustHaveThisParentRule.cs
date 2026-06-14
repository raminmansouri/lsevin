using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Rule;

public sealed class CategoryMustHaveThisParentRule(CategoryId expectedParentId, CategoryId? actualParentId)
    : IBusinessRule
{
    public bool IsBroken() => actualParentId != expectedParentId;

    public string Message => CategoryResource.Category_Must_Have_This_Parent_Error_Message;
}
