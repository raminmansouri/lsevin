using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderType;

public sealed record UpdateProviderTypeRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    bool IsActive,
    string? IconUrl = null
);
