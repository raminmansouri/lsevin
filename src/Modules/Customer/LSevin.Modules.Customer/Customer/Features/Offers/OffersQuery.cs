using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.Offers;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record OffersQuery(

PageRequest pageRequest, OffersRequest exploreRequest)
    : Query<OffersResponse>
{

    internal static OffersQuery? Of(PageRequest pageRequest, OffersRequest exploreRequest)
        => new OffersQuery(pageRequest, exploreRequest);
}
