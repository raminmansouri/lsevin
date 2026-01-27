using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.Category.Features.CreateCategory;

internal sealed record CreateCategoryRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    Guid? ParentId = null,
    int DisplayOrder = 0,
    bool IsActive = true,
    string? IconUrl = null
);
