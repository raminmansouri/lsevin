using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.GetRewardsPage;
using QuickType;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetRewardsPageQuery(

PageRequest pageRequest, GetRewardsPageRequest exploreRequest)
    : Query<GetRewardsPageResponse>
{

    internal static GetRewardsPageQuery? Of(PageRequest pageRequest, GetRewardsPageRequest exploreRequest)
        => new GetRewardsPageQuery(pageRequest, exploreRequest);
}
