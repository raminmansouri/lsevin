using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderGalleryItem;

public sealed record AddProviderGalleryItemRequest(
    string Title, // get string LocalizedContentDto
    string Description, // get string LocalizedContentDto
    IFormFile File
);
