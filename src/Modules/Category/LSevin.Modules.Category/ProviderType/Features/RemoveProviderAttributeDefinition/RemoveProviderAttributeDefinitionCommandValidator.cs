using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.RemoveProviderAttributeDefinition;

internal sealed class RemoveProviderAttributeDefinitionCommandValidator
    : AbstractValidator<RemoveProviderAttributeDefinitionCommand>
{
    public RemoveProviderAttributeDefinitionCommandValidator()
    {
        RuleFor(x => x.ProviderTypeId).NotEmpty().WithMessage(CategoryResource.Provider_Type);

        RuleFor(x => x.AttributeDefinitionId).NotEmpty().WithMessage(CategoryResource.Provider_Type);
    }
}
