using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;
using LSevin.Modules.Category.ServiceProvider.Dtos;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderById;

public sealed record GetServiceProviderByIdResponse(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    string Email,
    string? PhoneNumber,
    string? PhoneNumberCountryCode,
    string Country,
    string City,
    LocalizedContentResponseDto? Street,
    LocalizedContentResponseDto? Detail,
    string? ZipCode,
    CoordinatesDto? Coordinates,
    bool IsActive,
    Guid ProviderTypeId,
    string ProviderTypeName,
    int? GradeId,
    IReadOnlyCollection<ServiceProviderAttributeDto> Attributes,
    IReadOnlyCollection<ServiceProviderGalleryItemDto> GalleryItems,
    IReadOnlyCollection<ServiceProviderPolicyDto> Policies,
    IReadOnlyCollection<ServiceProviderServiceDto> Services,
    IReadOnlyCollection<ServiceProviderStaffDto> Staff,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
