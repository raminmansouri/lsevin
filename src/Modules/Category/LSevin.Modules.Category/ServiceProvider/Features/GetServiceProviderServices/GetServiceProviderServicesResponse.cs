using BuildingBlocks.Core.Dtos.Localization;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderServices;

public sealed record GetServiceProviderServicesResponse(
    Guid Id,
    Guid ServiceDefinitionId,
    string ServiceDefinitionName,
    LocalizedContentResponseDto DisplayName,
    LocalizedContentResponseDto Description,
    bool IsActive,
    string Currency,
    decimal Value,
    IReadOnlyCollection<ServiceAttributeValueDto> AttributeValues,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);

public sealed record ServiceAttributeValueDto(
    Guid Id,
    Guid AttributeDefinitionId,
    string AttributeName,
    LocalizedContentResponseDto Value
);
