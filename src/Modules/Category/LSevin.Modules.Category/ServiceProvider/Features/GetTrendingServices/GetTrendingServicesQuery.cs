using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetTrendingServicesQuery
    : Query<GetTrendingServicesResponse>
{
    public static GetTrendingServicesQuery Of => new();
}
