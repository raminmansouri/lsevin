namespace LSevin.Modules.Category.Staff.Dtos;

public sealed record StaffAvailabilityDto(
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
