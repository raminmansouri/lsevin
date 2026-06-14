using FluentValidation;

namespace LSevin.Modules.Category.Location.Features.GetCountries;

internal sealed class GetCountriesQueryValidator : AbstractValidator<GetCountriesQuery>
{
    public GetCountriesQueryValidator()
    {
        // No validation needed as there are no parameters
    }
}
