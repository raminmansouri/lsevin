namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeAttributes;

public sealed record GetProviderTypeAttributesResponse(
    Guid ProviderTypeId,
    string ProviderTypeName,
    IReadOnlyCollection<ProviderAttributeDto> Attributes
);

public sealed record ProviderAttributeDto(
    Guid Id,
    string Name,
    string Description,
    string AttributeType,
    bool IsRequired,
    IReadOnlyCollection<AttributeOptionDto>? Options
);

public sealed record AttributeOptionDto(string DisplayName, string Value);
