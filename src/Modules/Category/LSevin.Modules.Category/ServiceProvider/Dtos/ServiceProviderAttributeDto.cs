using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Dtos;

public sealed record ServiceProviderAttributeDto(
    Guid Id,
    Guid AttributeDefinitionId,
    string AttributeName,
    LocalizedContentResponseDto Value
);
