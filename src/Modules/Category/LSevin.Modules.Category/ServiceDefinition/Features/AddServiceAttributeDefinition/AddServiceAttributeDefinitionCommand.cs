using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;

internal sealed record AddServiceAttributeDefinitionCommand(
    Guid ServiceDefinitionId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeType,
    bool IsRequired,
    List<AttributeOptionInputDto>? Options
) : Command<Guid>;
