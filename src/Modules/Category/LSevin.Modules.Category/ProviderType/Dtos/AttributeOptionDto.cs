using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ProviderType.Dtos;

public sealed record AttributeOptionDto(LocalizedContentResponseDto DisplayName, LocalizedContentResponseDto Value);
