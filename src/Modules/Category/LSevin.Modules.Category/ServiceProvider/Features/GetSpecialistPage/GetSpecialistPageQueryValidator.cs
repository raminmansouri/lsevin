using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecialistPage;

internal sealed class GetSpecialistPageQueryValidator : AbstractValidator<GetSpecialistPageQuery>
{
    public GetSpecialistPageQueryValidator()
    {
        RuleFor(x => x.Id).ValidateGuid(CategoryResource.Service_Provider);
    }
}
