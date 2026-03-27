using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetFeaturedServicesQuery
    : Query<GetFeaturedServicesResponse>
{
    public static GetFeaturedServicesQuery Of => new();
}
