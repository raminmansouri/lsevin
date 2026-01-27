using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Category.Features.CreateCategory;

internal sealed record CreateCategoryCommand(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    Guid? ParentId = null,
    int? DisplayOrder = 1,
    bool IsActive = true,
    string? IconUrl = null
) : Command<Guid>;
