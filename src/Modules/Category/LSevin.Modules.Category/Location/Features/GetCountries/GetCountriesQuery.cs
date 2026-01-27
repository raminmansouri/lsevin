using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.Location.Features.GetCountries;

internal sealed record GetCountriesQuery() : Query<IReadOnlyCollection<GetCountriesResponse>>
{
    public static GetCountriesQuery Create() => new();
}
