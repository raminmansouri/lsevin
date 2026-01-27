using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.ChangeCategoryParent;

internal sealed class ChangeCategoryParentCommandValidator : AbstractValidator<ChangeCategoryParentCommand>
{
    public ChangeCategoryParentCommandValidator()
    {
        RuleFor(x => x.CategoryId).ValidateGuid(CategoryResource.Category);

        When(
            x => x.ParentId.HasValue,
            () =>
            {
                RuleFor(x => x.ParentId!.Value).ValidateGuid(CategoryResource.Category);
            }
        );
    }
}
