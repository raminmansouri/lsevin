using BuildingBlocks.Core.Messaging.Commands;
using Microsoft.AspNetCore.Http;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderGalleryItem;

public sealed record AddProviderGalleryItemCommand(
    Guid ServiceProviderId,
    IFormFile File,
    string Title, // get string LocalizedContentDto
    string Description // get string LocalizedContentDto
) : Command<Guid>;
