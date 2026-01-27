using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.CreateProviderType;

internal sealed class CreateProviderTypeCommandValidator : AbstractValidator<CreateProviderTypeCommand>
{
    public CreateProviderTypeCommandValidator()
    {
        RuleFor(x => x.Name)
            .ValidateLocalizedContent(
                CategoryResource.Provider_Type
            // maxLength: DomainConstValues.ProviderTypeNameMaxLength
            );

        RuleFor(x => x.Description)
            .ValidateLocalizedContent(
                CategoryResource.Provider_Type_Description
            // maxLength: DomainConstValues.ProviderTypeDescriptionMaxLength
            );
    }
}
