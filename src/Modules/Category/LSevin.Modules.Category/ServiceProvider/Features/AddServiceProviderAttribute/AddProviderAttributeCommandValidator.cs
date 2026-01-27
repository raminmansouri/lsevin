using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddServiceProviderAttribute;

public sealed class AddProviderAttributeCommandValidator : AbstractValidator<AddProviderAttributeCommand>
{
    public AddProviderAttributeCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).NotEmpty().WithMessage(CategoryResource.Service_Provider);

        RuleFor(x => x.AttributeDefinitionId).NotEmpty().WithMessage(CategoryResource.Provider_Attribute_Definition);

        RuleFor(x => x.Value).ValidateLocalizedContent(CategoryResource.Service_Provider);
    }
}
