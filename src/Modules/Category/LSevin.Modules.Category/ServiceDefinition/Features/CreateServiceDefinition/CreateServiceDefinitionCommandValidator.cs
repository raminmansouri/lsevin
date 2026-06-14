using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Features.CreateServiceDefinition;

internal sealed class CreateServiceDefinitionCommandValidator : AbstractValidator<CreateServiceDefinitionCommand>
{
    public CreateServiceDefinitionCommandValidator()
    {
        RuleFor(x => x.Name)
            .ValidateLocalizedContent(
                CategoryResource.Service_Name
            // maxLength: 100
            );

        RuleFor(x => x.Description)
            .ValidateLocalizedContent(
                CategoryResource.Service_Description
            // maxLength: 2000
            );

        RuleFor(x => x.CategoryId).ValidateGuid(CategoryResource.Category);

        RuleFor(x => x.DurationMinutes)
            .NotNull()
            .GreaterThanOrEqualTo(0)
            .WithMessage(CategoryResource.Service_Duration_Must_Be_Positive_Error_Message);

        RuleFor(x => x.Currency).ValidateText(CategoryResource.Service_Currency, maxLength: 15, minLength: 3);

        RuleFor(x => x.Value)
            .NotNull()
            .GreaterThanOrEqualTo(0)
            .WithMessage(CategoryResource.Service_Price_Must_Be_Valid_Error_Message);

        RuleFor(x => x.PricingModel).ValidateText(CategoryResource.Service_PricingModel, maxLength: 100);
    }
}
