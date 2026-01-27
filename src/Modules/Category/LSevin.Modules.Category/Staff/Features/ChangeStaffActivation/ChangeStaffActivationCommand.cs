using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.ChangeStaffActivation;

internal sealed record ChangeStaffActivationCommand(Guid StaffId, bool IsActive) : Command<Guid>;
