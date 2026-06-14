using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ProviderType.Features.RemoveProviderAttributeDefinition;

internal sealed record RemoveProviderAttributeDefinitionCommand(Guid ProviderTypeId, Guid AttributeDefinitionId)
    : Command<Guid>;
