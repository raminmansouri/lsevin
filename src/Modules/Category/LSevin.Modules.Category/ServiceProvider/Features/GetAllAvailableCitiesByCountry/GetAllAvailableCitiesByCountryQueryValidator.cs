using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCitiesByCountry;

internal sealed class GetAllAvailableCitiesByCountryQueryValidator
    : AbstractValidator<GetAllAvailableCitiesByCountryQuery>
{
    public GetAllAvailableCitiesByCountryQueryValidator()
    {
        RuleFor(query => query.CountryCode).ValidateText(SharedResource.Country);
    }
}
