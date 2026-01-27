using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeById;

/// <summary>
/// Response DTO for provider type detail queries - returns all translations for management interfaces.
/// </summary>
internal sealed record GetProviderTypeByIdResponse(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    bool IsActive,
    string? IconUrl,
    DateTime CreateDate,
    DateTime? LastModifiedDate,
    IReadOnlyCollection<ProviderAttributeDefinitionResponseDto> AttributeDefinitions
);

internal sealed record ProviderAttributeDefinitionResponseDto(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    string AttributeType,
    bool IsRequired,
    string? ValidationRules,
    IReadOnlyCollection<AttributeOptionResponseDto> Options
);

internal sealed record AttributeOptionResponseDto(
    LocalizedContentResponseDto DisplayName,
    LocalizedContentResponseDto Value
);
