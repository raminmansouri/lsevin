using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderGalleryItem;

public sealed record RemoveProviderGalleryItemCommand(Guid ServiceProviderId, Guid GalleryItemId) : Command<bool>;
