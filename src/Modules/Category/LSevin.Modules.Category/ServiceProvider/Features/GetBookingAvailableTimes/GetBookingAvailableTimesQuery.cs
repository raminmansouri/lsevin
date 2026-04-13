using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableTimes;

internal sealed record GetBookingAvailableTimesQuery( )
    : Query<GetBookingAvailableTimesResponse>
{
    public static GetBookingAvailableTimesQuery Of( ) =>
        new();
}
