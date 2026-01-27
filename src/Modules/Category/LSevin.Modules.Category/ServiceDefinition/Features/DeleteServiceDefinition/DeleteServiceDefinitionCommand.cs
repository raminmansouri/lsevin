using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.DeleteServiceDefinition;

internal sealed record DeleteServiceDefinitionCommand(Guid ServiceDefinitionId) : Command<Guid>;
