using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Location.Features.GetCitiesByCountry;

internal sealed class GetCitiesByCountryQueryValidator : AbstractValidator<GetCitiesByCountryQuery>
{
    public GetCitiesByCountryQueryValidator()
    {
        RuleFor(query => query.CountryId).ValidateGuid(SharedResource.Country);
    }
}
