using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderPolicy;

public sealed record AddProviderPolicyCommand(
    Guid ServiceProviderId,
    LocalizedContentDto Type,
    LocalizedContentDto Description
) : Command<Guid>;
