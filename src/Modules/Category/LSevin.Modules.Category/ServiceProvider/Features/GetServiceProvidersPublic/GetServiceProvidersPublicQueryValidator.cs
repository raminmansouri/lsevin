using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersPublic;

internal sealed class GetServiceProvidersPublicQueryValidator : AbstractValidator<GetServiceProvidersPublicQuery>
{
    public GetServiceProvidersPublicQueryValidator()
    {
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

        // Validate Filters if provided
        When(
            x => !string.IsNullOrWhiteSpace(x.Filters),
            () =>
            {
                RuleFor(x => x.Filters).ValidateText(SharedResource.Description);
            }
        );
    }
}
