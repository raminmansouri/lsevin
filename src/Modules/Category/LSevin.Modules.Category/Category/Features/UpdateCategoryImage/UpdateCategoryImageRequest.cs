using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

public sealed record UpdateCategoryImageRequest
{
    public required string CategoryId { get; init; } // JSON string for LocalizedContentDto

    public required IFormFile File { get; init; } // Optional - only if changing image
}
