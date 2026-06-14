using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceAttributeDefinition;

internal sealed class UpdateServiceAttributeDefinitionCommandValidator
    : AbstractValidator<UpdateServiceAttributeDefinitionCommand>
{
    public UpdateServiceAttributeDefinitionCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);

        RuleFor(x => x.AttributeDefinitionId).ValidateGuid(CategoryResource.Service_Attribute_Definition);

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
            .MustBeValidEnumeration<UpdateServiceAttributeDefinitionCommand, AttributeType>(
                CategoryResource.Service_Attribute_Type
            );

        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);

        RuleForEach(x => x.Options)
            .SetValidator(new UpdateAttributeOptionInputDtoValidator())
            .When(x => x.Options is not null);
    }
}

internal sealed class UpdateAttributeOptionInputDtoValidator : AbstractValidator<AttributeOptionInputDto>
{
    public UpdateAttributeOptionInputDtoValidator()
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
