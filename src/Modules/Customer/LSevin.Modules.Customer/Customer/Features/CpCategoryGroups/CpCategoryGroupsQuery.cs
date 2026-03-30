using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.Explore;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record CpCategoryGroupsQuery(

PageRequest pageRequest, CpCategoryGroupsRequest exploreRequest)
    : Query<CpCategoryGroupsResponse>
{

    internal static CpCategoryGroupsQuery? Of(PageRequest pageRequest, CpCategoryGroupsRequest exploreRequest)
        => new CpCategoryGroupsQuery(pageRequest, exploreRequest);
}
