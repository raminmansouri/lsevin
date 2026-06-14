namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitions;

/// <summary>
/// Response DTO for service definition list queries - returns localized strings for current user locale.
/// </summary>
internal sealed record GetServiceDefinitionsResponse(
    Guid Id,
    string Name,
    string Description,
    Guid CategoryId,
    string CategoryName,
    int DurationMinutes,
    decimal BasePrice,
    string Currency,
    string PricingModel,
    bool IsActive,
    int AttributeCount,
    int RequirementCount
);
