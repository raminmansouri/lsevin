using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;

internal sealed record GetBookingAvailableDatesQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<GetBookingAvailableDatesResponse>
{
    public static GetBookingAvailableDatesQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
