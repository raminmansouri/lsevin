using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderAttribute;

public sealed class RemoveProviderAttributeCommandValidator : AbstractValidator<RemoveProviderAttributeCommand>
{
    public RemoveProviderAttributeCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).NotEmpty().WithMessage(CategoryResource.Service_Provider);

        RuleFor(x => x.AttributeId).NotEmpty().WithMessage(CategoryResource.Provider_Attribute_Definition);
    }
}
