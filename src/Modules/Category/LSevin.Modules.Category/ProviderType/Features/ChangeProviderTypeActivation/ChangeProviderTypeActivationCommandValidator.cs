using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.ChangeProviderTypeActivation;

internal sealed class ChangeProviderTypeActivationCommandValidator
    : AbstractValidator<ChangeProviderTypeActivationCommand>
{
    public ChangeProviderTypeActivationCommandValidator()
    {
        RuleFor(x => x.ProviderTypeId).NotEmpty().WithMessage(CategoryResource.Provider_Type);
    }
}
