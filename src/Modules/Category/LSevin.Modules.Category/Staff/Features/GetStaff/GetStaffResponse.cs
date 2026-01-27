namespace LSevin.Modules.Category.Staff.Features.GetStaff;

public sealed record GetStaffResponse(
    Guid Id,
    string Name,
    string Biography,
    string Title,
    string? ProfileImageUrl,
    bool IsActive,
    int ServiceCount,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
