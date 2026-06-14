using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;

public sealed record AttributeOptionInputDto(
    LocalizedContentDto DisplayName,
    LocalizedContentDto Value,
    decimal? AdditionalPrice = null
);

internal sealed record AddServiceAttributeDefinitionRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeType,
    bool IsRequired,
    List<AttributeOptionInputDto>? Options
);
