using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ProviderType.Features.AddProviderAttributeDefinition;

internal sealed record AddProviderAttributeDefinitionCommand(
    Guid ProviderTypeId,
    LocalizedContentDto Name,
    LocalizedContentDto Description,
    int AttributeTypeId,
    bool IsRequired,
    string? ValidationRules,
    List<AttributeOptionInputDto>? Options
) : Command<Guid>;

public sealed record AttributeOptionInputDto(LocalizedContentDto DisplayName, LocalizedContentDto Value);
