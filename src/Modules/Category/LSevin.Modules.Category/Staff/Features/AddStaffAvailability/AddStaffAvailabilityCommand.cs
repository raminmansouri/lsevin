using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.AddStaffAvailability;

internal sealed record AddStaffAvailabilityCommand(
    Guid StaffId,
    DayOfWeek DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime,
    bool IsRecurring,
    int AvailabilityStatusId,
    DateTime? SpecificDate
) : Command<Guid>;
