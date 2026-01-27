using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.Category.Features.GetCategoryById;

/// <summary>
/// Response DTO for category detail queries - returns all translations for management interfaces.
/// </summary>
internal sealed record GetCategoryByIdResponse(
    Guid CategoryId,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    Guid? ParentId,
    string? ParentName,
    int DisplayOrder,
    bool IsActive,
    string? IconUrl,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
