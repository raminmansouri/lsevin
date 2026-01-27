namespace LSevin.Modules.Category.Category.Features.GetCategories;

internal sealed record GetCategoriesResponse(
    Guid CategoryId,
    string Name,
    string Description,
    Guid? ParentId,
    string? ParentName,
    int DisplayOrder,
    bool IsActive,
    string? IconUrl,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
