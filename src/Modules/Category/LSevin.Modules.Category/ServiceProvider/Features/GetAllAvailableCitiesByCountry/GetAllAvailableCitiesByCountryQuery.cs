using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCitiesByCountry;

internal sealed record GetAllAvailableCitiesByCountryQuery(string CountryCode)
    : IQuery<IReadOnlyCollection<GetAllAvailableCitiesByCountryResponse>>
{
    public static GetAllAvailableCitiesByCountryQuery Of(string countryCode) => new(countryCode);
}
