namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersPublic;

public sealed record GetServiceProvidersPublicResponse(
    Guid ProviderTypeId,
    string ProviderTypeName,
    int TotalCount,
    IReadOnlyCollection<ServiceProvidersPublicDto> ServiceProviders
);

public sealed class ServiceProvidersPublicDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public decimal? MinimumServicePrice { get; init; }
    public string? Currency { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string Grade { get; init; } = null!;
    public IReadOnlyCollection<ServiceProviderAttributeItemDto> Attributes { get; set; } =
        new List<ServiceProviderAttributeItemDto>();
}

public sealed record ServiceProviderAttributeItemDto(Guid Id, string AttributeName, string Value);
