using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaff;

public sealed record UpdateStaffRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Biography,
    LocalizedContentDto Title,
    string? ProfileImageUrl,
    bool IsActive
);
