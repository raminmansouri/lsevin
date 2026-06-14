using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.Category.Features.UpdateCategory;

internal sealed record UpdateCategoryCommand(
    Guid CateogryId,
    IFormFile? File, // Optional - only if changing image
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    bool IsActive,
    int? DisplayOrder = 1,
    string? IconUrl = null
) : Command<Guid>;
