using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceDefinition;

internal sealed record UpdateServiceDefinitionCommand(
    Guid ServiceDefinitionId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    Guid CategoryId,
    int DurationMinutes,
    string Currency,
    decimal Value,
    string PricingModel,
    bool IsActive
) : Command<Guid>;
