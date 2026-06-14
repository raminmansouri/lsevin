using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderService;

public sealed record AddProviderServiceCommand(
    Guid ServiceProviderId,
    Guid ServiceDefinitionId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    decimal Price,
    string Currency,
    int DurationMinutes,
    bool IsActive
) : Command<Guid>;
