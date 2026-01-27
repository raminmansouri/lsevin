using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderService;

public sealed record AddProviderServiceRequest(
    Guid ServiceDefinitionId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    decimal Price,
    string Currency,
    int DurationMinutes,
    bool IsActive
);
