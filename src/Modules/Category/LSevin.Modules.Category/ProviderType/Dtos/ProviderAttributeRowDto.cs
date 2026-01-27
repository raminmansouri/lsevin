namespace LSevin.Modules.Category.ProviderType.Dtos;

public sealed record ProviderAttributeRowDto(
    Guid Id,
    string Name,
    string Description,
    int AttributeTypeId,
    bool IsRequired,
    string? ValidationRules,
    string? DisplayName,
    string? Value,
    int? OptionId
);
