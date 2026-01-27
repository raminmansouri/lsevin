using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ProviderType.Features.AddProviderAttributeDefinition;

internal sealed class AddProviderAttributeDefinitionCommandValidator
    : AbstractValidator<AddProviderAttributeDefinitionCommand>
{
    public AddProviderAttributeDefinitionCommandValidator()
    {
        RuleFor(x => x.ProviderTypeId).NotEmpty().WithMessage(CategoryResource.Provider_Type);

        RuleFor(x => x.Name)
            .ValidateLocalizedContent(
                CategoryResource.Provider_Type
            // maxLength: DomainConstValues.ProviderAttributeNameMaxLength
            );

        RuleFor(x => x.Description)
            .ValidateLocalizedContent(
                CategoryResource.Provider_Type_Description
            // maxLength: DomainConstValues.ProviderAttributeDescriptionMaxLength
            );

        RuleFor(x => x.AttributeTypeId)
            .MustBeValidEnumeration<AddProviderAttributeDefinitionCommand, AttributeType>(
                CategoryResource.Provider_Type
            );

        When(
            x => !string.IsNullOrWhiteSpace(x.ValidationRules),
            () =>
            {
                RuleFor(x => x.ValidationRules)
                    .ValidateText(
                        CategoryResource.Provider_Type,
                        maxLength: DomainConstValues.ProviderAttributeValidationRulesMaxLength
                    );
            }
        );

        RuleForEach(x => x.Options).SetValidator(new AttributeOptionInputDtoValidator());
    }
}

internal sealed class AttributeOptionInputDtoValidator : AbstractValidator<AttributeOptionInputDto>
{
    public AttributeOptionInputDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .ValidateLocalizedContent(
                CategoryResource.Service_Attribute_Option_DisplayName
            // maxLength: DomainConstValues.AttributeOptionDisplayNameMaxLength
            );

        RuleFor(x => x.Value)
            .ValidateLocalizedContent(
                CategoryResource.Service_Attribute_Option_Value
            // maxLength: DomainConstValues.AttributeOptionValueMaxLength
            );
    }
}
