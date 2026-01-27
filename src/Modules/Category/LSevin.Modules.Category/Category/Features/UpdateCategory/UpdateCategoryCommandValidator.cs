using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Category.Features.UpdateCategory;

internal sealed class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.CateogryId).ValidateGuid(CategoryResource.Category);

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
