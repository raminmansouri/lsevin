using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.Location.Features.GetCitiesByCountry;

internal sealed record GetCitiesByCountryQuery(Guid CountryId) : Query<IReadOnlyCollection<GetCitiesByCountryResponse>>
{
    public static GetCitiesByCountryQuery Of(Guid countryId) => new(countryId);
}
