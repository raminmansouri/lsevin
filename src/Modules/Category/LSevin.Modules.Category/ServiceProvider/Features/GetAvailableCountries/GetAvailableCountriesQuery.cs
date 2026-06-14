using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCountries;

internal sealed record GetAvailableCountriesQuery() : IQuery<IReadOnlyCollection<GetAvailableCountriesResponse>>
{
    public static GetAvailableCountriesQuery Create() => new();
}
