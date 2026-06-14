using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateServiceProvider;

public sealed record UpdateServiceProviderRequest(
    Guid ServiceProviderId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    string ContactEmail,
    string ContactPhone,
    string CountryCode,
    AddressDto Address,
    Guid ProviderTypeId,
    int? GradeId,
    bool IsActive = true
);
