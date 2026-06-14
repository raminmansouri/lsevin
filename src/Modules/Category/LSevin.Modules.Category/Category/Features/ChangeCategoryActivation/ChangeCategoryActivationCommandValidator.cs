using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.ChangeCategoryActivation;

internal sealed class ChangeCategoryActivationCommandValidator : AbstractValidator<ChangeCategoryActivationCommand>
{
    public ChangeCategoryActivationCommandValidator()
    {
        RuleFor(x => x.CategoryId).ValidateGuid(CategoryResource.Category);
    }
}
