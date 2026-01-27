using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCitiesByCountry;

internal sealed class GetAvailableCitiesByCountryQueryValidator : AbstractValidator<GetAvailableCitiesByCountryQuery>
{
    public GetAvailableCitiesByCountryQueryValidator()
    {
        RuleFor(query => query.CountryCode).ValidateText(SharedResource.Country);
    }
}
