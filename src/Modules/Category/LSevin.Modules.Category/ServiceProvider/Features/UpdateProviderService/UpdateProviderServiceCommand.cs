using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderService;

public sealed record UpdateProviderServiceCommand(
    Guid ServiceProviderId,
    Guid ServiceId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    decimal Price,
    string Currency,
    int DurationMinutes,
    bool IsActive
) : Command<bool>;
