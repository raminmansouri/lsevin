using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDateTimes;

internal sealed record GetBookingAvailableDateTimesQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<GetBookingAvailableDateTimesResponse>
{
    public static GetBookingAvailableDateTimesQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
