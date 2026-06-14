namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersByProviderType;

public sealed record GetServiceProvidersByProviderTypeResponse(
    Guid Id,
    string Name,
    decimal? MinimumServicePrice,
    string? Currency,
    string? ThumbnailUrl,
    string Grade,
    IReadOnlyCollection<ServiceProviderAttributeItemDto> Attributes
);

public sealed record ServiceProviderAttributeItemDto(Guid Id, string AttributeName, string Value);
