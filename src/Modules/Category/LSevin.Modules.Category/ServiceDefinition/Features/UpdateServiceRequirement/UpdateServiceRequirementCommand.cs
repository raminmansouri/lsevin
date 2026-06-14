using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceRequirement;

internal sealed record UpdateServiceRequirementCommand(
    Guid ServiceDefinitionId,
    int RequirementIndex,
    LocalizedContentDto Description,
    bool IsMandatory
) : Command<Guid>;
