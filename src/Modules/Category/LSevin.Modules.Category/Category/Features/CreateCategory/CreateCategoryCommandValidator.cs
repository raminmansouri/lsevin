using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.CreateCategory;

internal sealed class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(x => x.Name)
            .ValidateLocalizedContent(
                CategoryResource.Category
            // maxLength: DomainConstValues.CategoryNameMaxLength
            );

        RuleFor(x => x.Description)
            .ValidateLocalizedContent(
                SharedResource.Description
            // maxLength: DomainConstValues.CategoryDescriptionMaxLength
            );

        // When(x => x.DisplayOrder is not null, () =>
        // {
        //     RuleFor(x => x.DisplayOrder!.Value)
        //         .ValidateNaturalNumber(CategoryResource.Category_DisplayOrder_Must_Be_NonNegative_Error_Message);
        // });
    }
}
