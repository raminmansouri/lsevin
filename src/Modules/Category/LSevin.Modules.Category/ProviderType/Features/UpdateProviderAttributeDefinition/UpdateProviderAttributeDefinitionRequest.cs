using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderAttributeDefinition;

internal sealed record UpdateProviderAttributeDefinitionRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeTypeId,
    bool IsRequired,
    string? ValidationRules,
    List<AttributeOptionInputDto>? Options
);
