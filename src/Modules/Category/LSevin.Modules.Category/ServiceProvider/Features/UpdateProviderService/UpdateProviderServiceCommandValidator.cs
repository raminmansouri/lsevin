using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderService;

public sealed class UpdateProviderServiceCommandValidator : AbstractValidator<UpdateProviderServiceCommand>
{
    public UpdateProviderServiceCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.ServiceId).ValidateGuid(CategoryResource.Service_Provider_Services);

        RuleFor(x => x.Name).ValidateLocalizedContent(CategoryResource.Service_Definition);

        RuleFor(x => x.Description).ValidateLocalizedContent(CategoryResource.Service_Name);

        RuleFor(x => x.Currency).ValidateText(CategoryResource.Service_Currency, maxLength: 15, minLength: 3);

        RuleFor(x => x.Price)
            .NotNull()
            .GreaterThanOrEqualTo(0)
            .WithMessage(CategoryResource.Service_Price_Must_Be_Valid_Error_Message);

        RuleFor(x => x.DurationMinutes).NotNull().GreaterThanOrEqualTo(0);
    }
}
