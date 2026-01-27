using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderPolicy;

internal sealed record UpdateProviderPolicyCommand(
    Guid ServiceProviderId,
    Guid PolicyId,
    LocalizedContentDto Type,
    LocalizedContentDto Description
) : Command<Guid>;
