using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

public record OffersResponse
{
    public List<OfferDto> Offers { get; init; } = new();
    internal OffersQueryHandler.OfferCategory[] Categories { get; set; }
}

public record OfferDto
{
    public int Id { get; init; }
    public string Title { get; init; } = default!;
    public string Subtitle { get; init; } = default!;
    public string Provider { get; init; } = default!;
    public string Category { get; init; } = default!;
    public string Image { get; init; } = default!;
    public decimal Discount { get; init; } = default!;
    public string ValidUntil { get; init; } = default!;
    public string Code { get; init; } = default!;
    public bool Verified { get; init; }
    public string Location { get; init; } = default!;
    public decimal Rating { get; init; }
    public decimal OriginalPrice { get; init; }
    public decimal DiscountedPrice { get; init; }
}
