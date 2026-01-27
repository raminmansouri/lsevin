using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderPolicies;

public sealed record GetServiceProviderPoliciesResponse(
    Guid Id,
    LocalizedContentResponseDto Type,
    LocalizedContentResponseDto Description,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
