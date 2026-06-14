using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Dtos;

public sealed class AttributeOptionDtoValidator : AbstractValidator<AttributeOptionDto>
{
    public AttributeOptionDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotNull()
            .WithMessage($"{CategoryResource.Service_Attribute_Option_DisplayName} is required");

        RuleFor(x => x.Value).NotNull().WithMessage($"{CategoryResource.Service_Attribute_Option_Value} is required");

        RuleFor(x => x.AdditionalPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.AdditionalPrice.HasValue)
            .WithMessage(CategoryResource.Service_Attribute_Option_AdditionalPrice_Must_Be_Positive_Error_Message);
    }
}
