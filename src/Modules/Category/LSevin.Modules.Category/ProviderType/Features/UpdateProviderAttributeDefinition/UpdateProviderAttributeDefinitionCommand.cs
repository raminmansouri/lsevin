using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Modules.Category.ProviderType.Features.AddProviderAttributeDefinition;

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderAttributeDefinition;

internal sealed record UpdateProviderAttributeDefinitionCommand(
    Guid ProviderTypeId,
    Guid AttributeDefinitionId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeTypeId,
    bool IsRequired,
    string? ValidationRules,
    List<AttributeOptionInputDto>? Options
) : Command<Guid>;

public sealed record AttributeOptionInputDto(LocalizedContentDto DisplayName, LocalizedContentDto Value);
