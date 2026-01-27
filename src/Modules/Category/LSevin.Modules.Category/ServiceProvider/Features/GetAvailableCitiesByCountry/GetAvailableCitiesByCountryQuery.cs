using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCitiesByCountry;

internal sealed record GetAvailableCitiesByCountryQuery(string CountryCode)
    : IQuery<IReadOnlyCollection<GetAvailableCitiesByCountryResponse>>
{
    public static GetAvailableCitiesByCountryQuery Of(string countryCode) => new(countryCode);
}
