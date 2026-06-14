using BuildingBlocks.Validation.Common;
using FluentValidation;

namespace LSevin.Modules.Category.Category.Features.GetCategories;

internal sealed class GetCategoriesQueryValidator : AbstractValidator<GetCategoriesQuery>
{
    public GetCategoriesQueryValidator()
    {
        Include(new PageRequestValidator());
    }
}
