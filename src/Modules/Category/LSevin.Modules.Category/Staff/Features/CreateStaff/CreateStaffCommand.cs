using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Staff.Features.CreateStaff;

internal sealed record CreateStaffCommand(
    LocalizedContentDto Name,
    LocalizedContentDto Biography,
    LocalizedContentDto Title,
    string? ProfileImageUrl,
    bool IsActive
) : Command<Guid>;
