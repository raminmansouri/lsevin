using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Rule;

public sealed class CategoryMustNotHaveDuplicateChildRule(
    IReadOnlyCollection<Entities.Category> existingChildren,
    CategoryId childId
) : IBusinessRule
{
    public bool IsBroken() => existingChildren.Any(c => c.Id == childId);

    public string Message => CategoryResource.Category_Must_Not_Have_Duplicate_Child_Error_Message;
}
