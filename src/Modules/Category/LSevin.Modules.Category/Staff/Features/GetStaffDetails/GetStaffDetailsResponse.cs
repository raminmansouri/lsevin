using BuildingBlocks.Core.Dtos.Localization;
using LSevin.Modules.Category.Staff.Dtos;

namespace LSevin.Modules.Category.Staff.Features.GetStaffDetails;

public sealed record GetStaffDetailsResponse(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Biography,
    LocalizedContentResponseDto Title,
    string? ProfileImageUrl,
    bool IsActive,
    DateTime CreateDate,
    DateTime? LastModifiedDate,
    IReadOnlyCollection<StaffAvailabilityDto> Availabilities,
    IReadOnlyCollection<StaffServiceDetailsDto> Services
);

// New DTO for services with localized notes
public sealed record StaffServiceDetailsDto(
    Guid Id,
    Guid ServiceDefinitionId,
    string ServiceName,
    string? ServiceDescription,
    decimal Price,
    int DurationInMinutes,
    bool IsActive,
    LocalizedContentResponseDto Notes,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
