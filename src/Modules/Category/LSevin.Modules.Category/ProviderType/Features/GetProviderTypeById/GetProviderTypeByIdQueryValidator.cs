using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeById;

internal sealed class GetProviderTypeByIdQueryValidator : AbstractValidator<GetProviderTypeByIdQuery>
{
    public GetProviderTypeByIdQueryValidator()
    {
        RuleFor(x => x.ProviderTypeId).NotEmpty().WithMessage(CategoryResource.Provider_Type);
    }
}
