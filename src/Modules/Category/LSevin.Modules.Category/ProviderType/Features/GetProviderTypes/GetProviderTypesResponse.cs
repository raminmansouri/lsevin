namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypes;

internal sealed record GetProviderTypesResponse(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    string? IconUrl,
    int AttributeDefinitionsCount,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
