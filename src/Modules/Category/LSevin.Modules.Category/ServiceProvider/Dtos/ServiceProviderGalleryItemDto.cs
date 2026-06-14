using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Dtos;

public sealed record ServiceProviderGalleryItemDto(
    Guid Id,
    LocalizedContentResponseDto Title,
    LocalizedContentResponseDto Description,
    string Url,
    string MediaType,
    int DisplayOrder
);
