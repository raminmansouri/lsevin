using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.GetHomePage;
using QuickType;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetHomePageQuery(

PageRequest pageRequest, GetHomePageRequest exploreRequest)
    : Query<GetHomePageResponse>
{

    internal static GetHomePageQuery? Of(PageRequest pageRequest, GetHomePageRequest exploreRequest)
        => new GetHomePageQuery(pageRequest, exploreRequest);
}
