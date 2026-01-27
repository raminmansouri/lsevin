using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.RemoveStaffService;

internal sealed record RemoveStaffServiceCommand(Guid StaffId, Guid ServiceId) : Command<Guid>;
