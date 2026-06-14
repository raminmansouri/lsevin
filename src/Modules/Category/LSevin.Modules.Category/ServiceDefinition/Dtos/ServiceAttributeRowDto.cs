namespace LSevin.Modules.Category.ServiceDefinition.Dtos;

public sealed record ServiceAttributeRowDto(
    Guid Id,
    string Name,
    string Description,
    int AttributeTypeId,
    bool IsRequired,
    bool AffectsPricing,
    int DisplayOrder,
    string? DisplayName,
    string? Value,
    decimal? AdditionalPrice
);
