using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;

internal sealed record GetBookingAvailableDatesQuery(string? providerId,
    string? serviceId,
    string? specialistId)
    : Query<GetBookingAvailableDatesResponse>
{
    public static GetBookingAvailableDatesQuery Of(string? providerId,
    string? serviceId,
    string? specialistId) =>
        new(providerId,
    serviceId,
   specialistId);
}
