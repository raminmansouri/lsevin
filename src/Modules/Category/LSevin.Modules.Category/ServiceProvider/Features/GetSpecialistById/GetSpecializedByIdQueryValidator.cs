using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecializedById;

internal sealed class GetSpecializedByIdQueryValidator : AbstractValidator<GetSpecializedByIdQuery>
{
    public GetSpecializedByIdQueryValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
