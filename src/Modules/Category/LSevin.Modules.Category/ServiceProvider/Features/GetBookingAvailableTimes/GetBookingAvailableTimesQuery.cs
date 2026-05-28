using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableTimes;

internal sealed record GetBookingAvailableTimesQuery(string? providerId,
    string? serviceId,
    string? specialistId,
    string selectedDate)
    : Query<GetBookingAvailableTimesResponse>
{
    public static GetBookingAvailableTimesQuery Of(string? providerId,
    string? serviceId,
    string? specialistId, string selectedDate) =>
        new(providerId,
    serviceId,
    specialistId, selectedDate);
}
