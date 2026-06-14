using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionsWithAllLocales;

internal sealed record GetServiceDefinitionsWithAllLocalesResponse(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    Guid CategoryId,
    string CategoryName,
    int DurationMinutes,
    decimal BasePrice,
    string Currency,
    string PricingModel,
    bool IsActive
);
