using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Dtos;

public sealed record ServiceProviderPolicyDto(
    Guid Id,
    LocalizedContentResponseDto Type,
    LocalizedContentResponseDto Description
);
