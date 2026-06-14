using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeAttributes;

internal sealed class GetProviderTypeAttributesQueryValidator : AbstractValidator<GetProviderTypeAttributesQuery>
{
    public GetProviderTypeAttributesQueryValidator()
    {
        RuleFor(query => query.ProviderTypeId).ValidateGuid(CategoryResource.Provider_Type);
    }
}
