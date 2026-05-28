namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;

//public sealed record GetBookingAvailableDatesRequest(bool? IsActive);


public sealed record GetBookingAvailableDatesRequest(

    string? providerId,
    string? serviceId,
    string? specialistId);