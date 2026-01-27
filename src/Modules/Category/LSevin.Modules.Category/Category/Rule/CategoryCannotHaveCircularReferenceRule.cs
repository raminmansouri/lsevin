using System.Collections.Generic;
using System.Linq;
using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.Resources;
using CategoryDomain = LSevin.Modules.Category.Category.Entities.Category;

namespace LSevin.Modules.Category.Category.Rule;

public sealed class CategoryCannotHaveCircularReferenceRule(
    IReadOnlyCollection<CategoryDomain> categories,
    CategoryId categoryId,
    CategoryId newParentId
) : IBusinessRule
{
    public bool IsBroken()
    {
        var visited = new HashSet<CategoryId>();
        var currentId = newParentId;

        while (currentId != null)
        {
            if (!visited.Add(currentId) || currentId == categoryId)
                return true;

            var currentCategory = categories.FirstOrDefault(c => c.Id == currentId);
            if (currentCategory == null)
                break;

            currentId = currentCategory.ParentId;
        }

        return false;
    }

    public string Message => CategoryResource.Category_Circular_Reference_Error_Message;
}
