using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.RemoveServiceRequirement;

internal sealed record RemoveServiceRequirementCommand(Guid ServiceDefinitionId, int RequirementIndex) : Command<Guid>;
