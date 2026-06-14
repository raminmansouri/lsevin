using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;

internal sealed class AddServiceAttributeDefinitionCommandValidator
    : AbstractValidator<AddServiceAttributeDefinitionCommand>
{
    public AddServiceAttributeDefinitionCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);

        RuleFor(x => x.Name)
            .ValidateLocalizedContent(
                CategoryResource.Service_Attribute_Name
            // maxLength: DomainConstValues.ServiceAttributeNameMaxLength
            );

        RuleFor(x => x.Description)
            .ValidateLocalizedContent(
                CategoryResource.Service_Attribute_Description
            // maxLength: DomainConstValues.ServiceAttributeDescriptionMaxLength
            );

        RuleFor(x => x.AttributeType)
            .MustBeValidEnumeration<AddServiceAttributeDefinitionCommand, AttributeType>(
                CategoryResource.Service_Attribute_Type
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

        RuleFor(x => x.AdditionalPrice).GreaterThanOrEqualTo(0).When(x => x.AdditionalPrice.HasValue);
    }
}
