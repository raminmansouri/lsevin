namespace LSevin.Modules.Category.Staff.Features.AddStaffAvailability;

public sealed record AddStaffAvailabilityRequest(
    DayOfWeek DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime,
    bool IsRecurring,
    int AvailabilityStatusId,
    DateTime? SpecificDate = null
);
