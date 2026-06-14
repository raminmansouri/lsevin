using BuildingBlocks.Core.Dtos.Localization;
using LSevin.Modules.Category.Staff.Dtos;
using LSevin.Modules.Category.Staff.Features.GetStaffDetails;

namespace LSevin.Modules.Category.Staff.Features.GetStaffById;

internal sealed record GetStaffByIdResponse(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Biography,
    LocalizedContentResponseDto Title,
    string? ProfileImageUrl,
    bool IsActive,
    DateTime CreateDate,
    DateTime? LastModifiedDate,
    IReadOnlyCollection<StaffServiceDetailsDto> Services,
    IReadOnlyCollection<StaffAvailabilityDto> Availabilities
);
