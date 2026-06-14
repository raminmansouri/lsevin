using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Dtos;

internal sealed record ServiceProviderDto(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    string ContactEmail,
    string ContactPhone,
    string Country,
    string City,
    string Street,
    string Detail,
    string ZipCode,
    bool IsActive,
    Guid ProviderTypeId,
    string ProviderTypeName,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
