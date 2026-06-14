using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ProviderType.Features.CreateProviderType;

public sealed record CreateProviderTypeRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    bool IsActive = true,
    string? IconUrl = null
);
