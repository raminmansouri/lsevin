using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersPublic;

public sealed record GetServiceProvidersPublicRequest(string? CountryCode, string? CityCode, string? Filters);
