namespace LSevin.Modules.Category.Staff.Features.GetStaffAvailability;

public sealed record GetStaffAvailabilityResponse(
    Guid Id,
    DayOfWeek DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime,
    bool IsRecurring,
    DateTime? SpecificDate,
    int AvailabilityStatusId,
    string AvailabilityStatusName,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
