using BuildingBlocks.Core.Dtos.Localization;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.Category.Features.UpdateCategory;

internal sealed record UpdateCategoryRequest(
    LocalizedContentDto Name,
    IFormFile? File,

    LocalizedContentDto Description,
    int DisplayOrder,
    bool IsActive,
    string? IconUrl = null
);
