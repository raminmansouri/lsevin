using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.Staff.Features.CreateStaff;

public sealed record CreateStaffRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Biography,
    LocalizedContentDto Title,
    string? ProfileImageUrl,
    bool IsActive = true
);
