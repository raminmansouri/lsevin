using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderGalleryItem;

public sealed record UpdateProviderGalleryItemRequest
{
    public required string Title { get; init; } // JSON string for LocalizedContentDto
    public required string Description { get; init; } // JSON string for LocalizedContentDto
    public required int DisplayOrder { get; init; }
    public IFormFile? File { get; init; } // Optional - only if changing image
}
