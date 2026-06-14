namespace LSevin.Modules.Category.Staff.Dtos;

public sealed record StaffDto(
    Guid Id,
    string Name,
    string Biography,
    string Title,
    string? ProfileImageUrl,
    bool IsActive,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
