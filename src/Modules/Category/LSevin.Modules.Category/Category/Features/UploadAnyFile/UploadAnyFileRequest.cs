using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

public sealed record UploadAnyFileRequest
{
    public required string path { get; init; } // JSON string for LocalizedContentDto

    public required IFormFile File { get; init; } // Optional - only if changing image
}
