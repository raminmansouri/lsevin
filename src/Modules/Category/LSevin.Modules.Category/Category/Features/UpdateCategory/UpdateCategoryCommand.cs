using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.Category.Features.UpdateCategory;

internal sealed record UpdateCategoryCommand(
    Guid CateogryId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    bool IsActive,
    int? DisplayOrder = 1,
    string? IconUrl = null
) : Command<Guid>;
