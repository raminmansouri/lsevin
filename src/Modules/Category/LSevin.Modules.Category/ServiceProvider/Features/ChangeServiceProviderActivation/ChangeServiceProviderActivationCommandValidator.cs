using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.ChangeServiceProviderActivation;

internal sealed class ChangeServiceProviderActivationCommandValidator
    : AbstractValidator<ChangeServiceProviderActivationCommand>
{
    public ChangeServiceProviderActivationCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
