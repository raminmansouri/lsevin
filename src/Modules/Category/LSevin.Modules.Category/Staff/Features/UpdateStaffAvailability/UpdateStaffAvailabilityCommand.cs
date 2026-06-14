using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffAvailability;

internal sealed record UpdateStaffAvailabilityCommand(
    Guid StaffId,
    Guid AvailabilityId,
    DayOfWeek DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime,
    bool IsRecurring,
    int AvailabilityStatusId,
    DateTime? SpecificDate
) : Command<Guid>;
