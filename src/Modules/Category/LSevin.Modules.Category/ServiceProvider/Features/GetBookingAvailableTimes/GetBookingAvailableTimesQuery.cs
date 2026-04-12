using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableTimes;

internal sealed record GetBookingAvailableTimesQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<GetBookingAvailableTimesResponse>
{
    public static GetBookingAvailableTimesQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
