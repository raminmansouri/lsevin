using BuildingBlocks.Core.Messaging.Commands;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderGalleryItem;

public sealed record UpdateProviderGalleryItemCommand(
    Guid ServiceProviderId,
    Guid GalleryItemId,
    IFormFile? File, // Optional - only if changing image
    string Title, // JSON string for LocalizedContentDto
    string Description, // JSON string for LocalizedContentDto
    int DisplayOrder
) : Command<Guid>;
