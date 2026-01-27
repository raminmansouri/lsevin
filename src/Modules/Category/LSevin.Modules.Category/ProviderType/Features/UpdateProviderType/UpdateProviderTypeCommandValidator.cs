using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderType;

internal sealed class UpdateProviderTypeCommandValidator : AbstractValidator<UpdateProviderTypeCommand>
{
    public UpdateProviderTypeCommandValidator()
    {
        RuleFor(x => x.ProviderTypeId).NotEmpty().WithMessage(CategoryResource.Provider_Type);

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
