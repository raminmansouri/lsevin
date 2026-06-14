namespace LSevin.Modules.Category.ServiceDefinition.Dtos;

public sealed record ServiceDefinitionDto(
    Guid Id,
    string Name,
    string Description,
    Guid CategoryId,
    string CategoryName,
    int DurationMinutes,
    string Currency,
    decimal Value,
    string PricingModel,
    bool IsActive
);
