using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderService;

public sealed class AddProviderServiceCommandValidator : AbstractValidator<AddProviderServiceCommand>
{
    public AddProviderServiceCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.ServiceDefinitionId).ValidateGuid(CategoryResource.Service_Definition);

        RuleFor(x => x.Name).ValidateLocalizedContent(CategoryResource.Service_Name);

        RuleFor(x => x.Description).ValidateLocalizedContent(CategoryResource.Service_Description);

        RuleFor(x => x.Currency).ValidateText(CategoryResource.Service_Currency, maxLength: 3, minLength: 3);

        RuleFor(x => x.Price)
            .NotNull()
            .GreaterThanOrEqualTo(0)
            .WithMessage(CategoryResource.Service_Price_Must_Be_Valid_Error_Message);

        RuleFor(x => x.DurationMinutes).GreaterThanOrEqualTo(0);
    }
}
