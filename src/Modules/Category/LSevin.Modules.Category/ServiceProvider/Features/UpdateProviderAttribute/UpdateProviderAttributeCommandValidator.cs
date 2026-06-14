using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderAttribute;

internal sealed class UpdateProviderAttributeCommandValidator : AbstractValidator<UpdateProviderAttributeCommand>
{
    public UpdateProviderAttributeCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.AttributeDefinitionId).ValidateGuid(CategoryResource.Service_Provider_Attributes);

        RuleFor(x => x.Value).ValidateLocalizedContent(CategoryResource.Provider_Attribute_Value);
    }
}
