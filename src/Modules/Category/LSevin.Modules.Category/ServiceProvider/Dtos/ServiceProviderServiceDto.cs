using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Dtos;

public sealed record ServiceProviderServiceDto(
    Guid Id,
    Guid ServiceDefinitionId,
    int DurationMinutes,
    LocalizedContentResponseDto DisplayName,
    LocalizedContentResponseDto Description,
    bool IsActive,
    string Currency,
    decimal Value
);
