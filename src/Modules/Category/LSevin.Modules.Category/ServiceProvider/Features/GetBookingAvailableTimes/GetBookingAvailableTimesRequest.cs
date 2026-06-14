namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableTimes;

public sealed record GetBookingAvailableTimesRequest(
     string? providerId,
    string? serviceId,
    string? specialistId,
    string? selectedDate);
