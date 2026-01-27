using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.RemoveStaffAvailability;

internal sealed record RemoveStaffAvailabilityCommand(Guid StaffId, Guid AvailabilityId) : Command<Guid>;
