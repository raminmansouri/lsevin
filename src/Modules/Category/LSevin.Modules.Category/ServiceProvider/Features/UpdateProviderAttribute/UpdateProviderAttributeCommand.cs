using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderAttribute;

internal sealed record UpdateProviderAttributeCommand(
    Guid ServiceProviderId,
    Guid AttributeDefinitionId,
    LocalizedContentDto Value
) : Command<Guid>;
