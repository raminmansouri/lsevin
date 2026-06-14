using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.Bookings;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record BookingsQuery(

PageRequest pageRequest, BookingsRequest exploreRequest)
    : Query<BookingsResponse>
{

    internal static BookingsQuery? Of(PageRequest pageRequest, BookingsRequest exploreRequest)
        => new BookingsQuery(pageRequest, exploreRequest);
}
