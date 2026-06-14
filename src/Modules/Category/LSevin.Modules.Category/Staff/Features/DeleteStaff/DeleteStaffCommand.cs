using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.DeleteStaff;

internal sealed record DeleteStaffCommand(Guid StaffId) : Command<Guid>;
