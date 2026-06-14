using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceRequirement;

internal sealed record AddServiceRequirementCommand(
    Guid ServiceDefinitionId,
    LocalizedContentDto Description,
    bool IsMandatory
) : Command<Guid>;
