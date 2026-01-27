using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderService;

public sealed record UpdateProviderServiceRequest(
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    decimal Price,
    string Currency,
    int DurationMinutes,
    bool IsActive
);
