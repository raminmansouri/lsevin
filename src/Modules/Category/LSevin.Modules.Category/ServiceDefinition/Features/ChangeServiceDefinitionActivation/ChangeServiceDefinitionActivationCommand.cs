using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.ChangeServiceDefinitionActivation;

internal sealed record ChangeServiceDefinitionActivationCommand(Guid ServiceDefinitionId, bool IsActive)
    : Command<Guid>;
