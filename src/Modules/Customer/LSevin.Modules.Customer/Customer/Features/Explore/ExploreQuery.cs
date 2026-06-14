using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.Explore;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record ExploreQuery(

PageRequest pageRequest, ExploreRequest exploreRequest)
    : Query<ExploreResponse>
{

    internal static ExploreQuery? Of(PageRequest pageRequest, ExploreRequest exploreRequest)
        => new ExploreQuery(pageRequest, exploreRequest);
}
