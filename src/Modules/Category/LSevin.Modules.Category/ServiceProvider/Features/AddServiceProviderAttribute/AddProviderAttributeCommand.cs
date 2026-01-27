using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddServiceProviderAttribute;

public sealed record AddProviderAttributeCommand(
    Guid ServiceProviderId,
    Guid AttributeDefinitionId,
    LocalizedContentDto Value
) : Command<Guid>;
