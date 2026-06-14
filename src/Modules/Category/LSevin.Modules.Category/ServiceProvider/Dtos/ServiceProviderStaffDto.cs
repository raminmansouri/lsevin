using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Dtos;

public sealed record ServiceProviderStaffDto(
    Guid Id,
    Guid StaffId,
    string StaffName,
    string StaffTitle,
    LocalizedContentResponseDto Notes,
    bool IsActive
);
