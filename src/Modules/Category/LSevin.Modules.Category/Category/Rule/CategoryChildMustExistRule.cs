using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Rule;

public sealed class CategoryChildMustExistRule(
    IReadOnlyCollection<Entities.Category> existingChildren,
    CategoryId childId
) : IBusinessRule
{
    public bool IsBroken() => existingChildren.All(c => c.Id != childId);

    public string Message => CategoryResource.Category_Child_Must_Exist_Error_Message;
}
