using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderGallery;

public sealed record GetServiceProviderGalleryResponse(
    Guid Id,
    LocalizedContentResponseDto Title,
    LocalizedContentResponseDto Description,
    string Url,
    string MediaType,
    int DisplayOrder,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
