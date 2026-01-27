namespace LSevin.Modules.Category.Staff.Features.UpdateStaffAvailability;

public sealed record UpdateStaffAvailabilityRequest(
    DayOfWeek DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime,
    bool IsRecurring,
    int AvailabilityStatusId,
    DateTime? SpecificDate = null
);
