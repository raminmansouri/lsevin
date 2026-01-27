using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ProviderType.Dtos;

public sealed record ProviderAttributeDefinitionDto(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    string AttributeType,
    bool IsRequired,
    string? ValidationRules,
    IReadOnlyCollection<AttributeOptionDto> Options
);
