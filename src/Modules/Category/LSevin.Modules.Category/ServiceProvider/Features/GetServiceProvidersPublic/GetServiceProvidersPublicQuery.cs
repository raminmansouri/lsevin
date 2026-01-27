using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersPublic;

internal sealed record GetServiceProvidersPublicQuery(string? CountryCode, string? CityCode, string? Filters)
    : IQuery<IReadOnlyCollection<GetServiceProvidersPublicResponse>>;
