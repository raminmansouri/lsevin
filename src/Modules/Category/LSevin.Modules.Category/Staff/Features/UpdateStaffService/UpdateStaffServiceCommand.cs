using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffService;

internal sealed record UpdateStaffServiceCommand(
    Guid StaffId,
    Guid ServiceId,
    bool IsActive,
    LocalizedContentDto Notes,
    Guid? ServiceDefinitionId = null
) : Command<Guid>;
