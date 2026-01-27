using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCountries;

internal sealed class GetAllAvailableCountriesQueryValidator : AbstractValidator<GetAllAvailableCountriesQuery>
{
    public GetAllAvailableCountriesQueryValidator()
    {
        // No validation needed as there are no parameters
    }
}
