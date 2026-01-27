using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceAttributeDefinition;

internal sealed record UpdateServiceAttributeDefinitionCommand(
    Guid ServiceDefinitionId,
    Guid AttributeDefinitionId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeType,
    bool IsRequired,
    bool AffectsPricing,
    int DisplayOrder,
    List<AttributeOptionInputDto>? Options
) : Command<Guid>;
