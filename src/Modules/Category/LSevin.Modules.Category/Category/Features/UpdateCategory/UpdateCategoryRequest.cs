using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.Category.Features.UpdateCategory;

internal sealed record UpdateCategoryRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int DisplayOrder,
    bool IsActive,
    string? IconUrl = null
);
