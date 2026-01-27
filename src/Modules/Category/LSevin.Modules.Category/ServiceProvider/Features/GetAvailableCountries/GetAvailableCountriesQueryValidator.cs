using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCountries;

internal sealed class GetAvailableCountriesQueryValidator : AbstractValidator<GetAvailableCountriesQuery>
{
    public GetAvailableCountriesQueryValidator()
    {
        // No validation needed as there are no parameters
    }
}
