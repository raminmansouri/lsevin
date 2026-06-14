using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.CreateServiceProvider;

public sealed record CreateServiceProviderRequest(
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
