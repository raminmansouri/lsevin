using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersByProviderType;

internal sealed class GetServiceProvidersByProviderTypeQueryValidator
    : AbstractValidator<GetServiceProvidersByProviderTypeQuery>
{
    public GetServiceProvidersByProviderTypeQueryValidator()
    {
        RuleFor(query => query.ProviderTypeId).ValidateGuid(CategoryResource.Provider_Type);

        // Validate CountryCode if provided
        When(
            x => !string.IsNullOrWhiteSpace(x.CountryCode),
            () =>
            {
                RuleFor(x => x.CountryCode).ValidateText(SharedResource.Country);
            }
        );

        // Validate CityCode if provided
        When(
            x => !string.IsNullOrWhiteSpace(x.CityCode),
            () =>
            {
                RuleFor(x => x.CityCode).ValidateText(SharedResource.City);
            }
        );

        // Validate AttributeFilters if provided (format: "guid:value")
        When(
            x => x.AttributeFilters != null && x.AttributeFilters.Length > 0,
            () =>
            {
                RuleFor(x => x.AttributeFilters)
                    .Must(filters => filters!.Length <= 20)
                    .WithMessage("Cannot apply more than 20 attribute filters");

                RuleForEach(x => x.AttributeFilters)
                    .Must(filterString => !string.IsNullOrWhiteSpace(filterString))
                    .WithMessage("Attribute filter cannot be empty")
                    .Must(filterString =>
                    {
                        var parts = filterString.Split(':', 2);
                        return parts.Length == 2
                            && Guid.TryParse(parts[0], out _)
                            && !string.IsNullOrWhiteSpace(parts[1]);
                    })
                    .WithMessage("Attribute filter must be in format 'guid:value'");
            }
        );
    }
}
