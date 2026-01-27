using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderType;

internal sealed record UpdateProviderTypeCommand(
    Guid ProviderTypeId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    bool IsActive,
    string? IconUrl = null
) : Command<Guid>;
