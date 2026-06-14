using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ProviderType.Features.CreateProviderType;

internal sealed record CreateProviderTypeCommand(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    bool IsActive,
    string? IconUrl = null
) : Command<Guid>;
