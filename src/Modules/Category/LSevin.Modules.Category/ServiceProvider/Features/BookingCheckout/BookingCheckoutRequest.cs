using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;

public sealed record BookingCheckoutRequest(
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
