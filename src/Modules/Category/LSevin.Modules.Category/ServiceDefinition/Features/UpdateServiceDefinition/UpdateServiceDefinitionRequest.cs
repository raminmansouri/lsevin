using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceDefinition;

internal sealed record UpdateServiceDefinitionRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    Guid CategoryId,
    int DurationMinutes,
    string Currency,
    decimal Value,
    string PricingModel,
    bool IsActive
);
