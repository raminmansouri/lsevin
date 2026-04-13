using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;

internal sealed record GetBookingAvailableDatesQuery()
    : Query<GetBookingAvailableDatesResponse>
{
    public static GetBookingAvailableDatesQuery Of() =>
        new();
}
