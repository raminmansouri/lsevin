using BuildingBlocks.Core.Dtos.Localization;
using LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceAttributeDefinition;

internal sealed record UpdateServiceAttributeDefinitionRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeType,
    bool IsRequired,
    bool AffectsPricing,
    int DisplayOrder,
    List<AttributeOptionInputDto>? Options
);
