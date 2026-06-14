using BuildingBlocks.Core.Dtos.Localization;
using LSevin.Modules.Category.ServiceDefinition.Dtos;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionDetails;

/// <summary>
/// Response DTO for service definition detail queries - returns all translations for management interfaces.
/// </summary>
internal sealed record GetServiceDefinitionDetailsResponse(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    Guid CategoryId,
    string CategoryName,
    int DurationMinutes,
    string Currency,
    decimal Value,
    string PricingModel,
    bool IsActive,
    IReadOnlyCollection<ServiceAttributeDefinitionDto> AttributeDefinitions,
    IReadOnlyCollection<ServiceRequirementDto> Requirements
);

internal sealed record ServiceAttributeDefinitionDto(
    Guid Id,
    LocalizedContentResponseDto Name,
    LocalizedContentResponseDto Description,
    string AttributeType,
    bool IsRequired,
    bool AffectsPricing,
    int DisplayOrder,
    IReadOnlyCollection<AttributeOptionDto> Options
);

internal sealed record ServiceRequirementDto(LocalizedContentResponseDto Description, bool IsMandatory);
