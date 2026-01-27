using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ProviderType.Features.AddProviderAttributeDefinition;

public sealed record AddProviderAttributeDefinitionRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeTypeId,
    bool IsRequired,
    string? ValidationRules,
    List<AttributeOptionInputDto>? Options
);
