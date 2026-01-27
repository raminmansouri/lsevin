using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.RemoveServiceAttributeDefinition;

internal sealed record RemoveServiceAttributeDefinitionCommand(Guid ServiceDefinitionId, Guid AttributeDefinitionId)
    : Command<Guid>;
