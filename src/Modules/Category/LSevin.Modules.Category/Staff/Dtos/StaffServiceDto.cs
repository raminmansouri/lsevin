namespace LSevin.Modules.Category.Staff.Dtos;

public sealed record StaffServiceDto(
    Guid Id,
    Guid ServiceDefinitionId,
    string ServiceName,
    string? ServiceDescription,
    decimal Price,
    int DurationInMinutes,
    bool IsActive,
    string? Notes,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
