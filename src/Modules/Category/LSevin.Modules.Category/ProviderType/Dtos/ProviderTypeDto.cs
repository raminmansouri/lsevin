namespace LSevin.Modules.Category.ProviderType.Dtos;

public sealed record ProviderTypeDto(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
