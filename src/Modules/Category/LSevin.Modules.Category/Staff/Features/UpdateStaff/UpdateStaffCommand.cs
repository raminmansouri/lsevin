using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaff;

internal sealed record UpdateStaffCommand(
    Guid StaffId,
    LocalizedContentDto Name,
    LocalizedContentDto Biography,
    LocalizedContentDto Title,
    string? ProfileImageUrl,
    bool IsActive
) : Command<Guid>;
