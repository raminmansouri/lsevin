using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.GetBookingById;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetBookingByIdQuery(

PageRequest pageRequest, GetBookingByIdRequest exploreRequest)
    : Query<GetBookingByIdResponse>
{

    internal static GetBookingByIdQuery? Of(PageRequest pageRequest, GetBookingByIdRequest exploreRequest)
        => new GetBookingByIdQuery(pageRequest, exploreRequest);
}
