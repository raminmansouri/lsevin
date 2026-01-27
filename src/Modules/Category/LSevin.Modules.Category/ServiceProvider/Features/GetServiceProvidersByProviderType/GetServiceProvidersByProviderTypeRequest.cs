using Microsoft.AspNetCore.Mvc;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersByProviderType;

public sealed record GetServiceProvidersByProviderTypeRequest(
    Guid ProviderTypeId,
    string? CountryCode,
    string? CityCode,
    [property: FromQuery] string[]? AttributeFilters
);

public sealed record ProviderAttributeFilterDto(Guid AttributeDefinitionId, string Value);
