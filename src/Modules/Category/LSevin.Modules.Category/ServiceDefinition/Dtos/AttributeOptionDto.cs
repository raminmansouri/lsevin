using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceDefinition.Dtos;

public sealed record AttributeOptionDto(
    LocalizedContentResponseDto DisplayName,
    LocalizedContentResponseDto Value,
    decimal? AdditionalPrice = null
);
