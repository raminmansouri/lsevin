namespace LSevin.Modules.Category.Staff.Features.GetStaffServices;

public sealed record GetStaffServicesResponse(
    Guid Id,
    Guid ServiceId,
    string ServiceName,
    string? ServiceDescription,
    decimal Price,
    int DurationInMinutes,
    bool IsActive,
    string? Notes,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
