using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCountries;

internal sealed record GetAllAvailableCountriesQuery() : IQuery<IReadOnlyCollection<GetAllAvailableCountriesResponse>>
{
    public static GetAllAvailableCountriesQuery Create() => new();
}
