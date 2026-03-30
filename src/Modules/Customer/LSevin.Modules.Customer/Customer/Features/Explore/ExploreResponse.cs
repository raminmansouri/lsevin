using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;


public sealed record ExploreResponse
{
    public List<ExploreSponsoredProvider> SponsoredProviders { get; internal set; }
    public List<ExploreTrendingService> TrendingServices { get; internal set; }
    public List<ExploreFeaturedProvider> FeaturedProviders { get; internal set; }
    public List<ExploreCategory> Categories { get; internal set; }
}
public sealed record ExploreTrendingService
{
    public int Id { get; internal set; }
    public string Name { get; internal set; }
    public string Provider { get; internal set; }
    public string Image { get; internal set; }
    public int Price { get; internal set; }
    public int OriginalPrice { get; internal set; }
    public double Rating { get; internal set; }
    public int Reviews { get; internal set; }
    public string Growth { get; internal set; }
    public string Location { get; internal set; }
}
public sealed record ExploreSponsoredProvider
{
    public int Id { get; internal set; }
    public string Name { get; internal set; }
    public string Subtitle { get; internal set; }
    public string Image { get; internal set; }
    public int Price { get; internal set; }
    public string Tag { get; internal set; }
}
public sealed record ExploreFeaturedProvider
{
    public int Id { get; internal set; }
    public string Name { get; internal set; }
    public string Image { get; internal set; }
    public double Rating { get; internal set; }
    public int Reviews { get; internal set; }
    public bool Verified { get; internal set; }
    public string Location { get; internal set; }
    public string[] Specialties { get; internal set; }
    public string ResponseTime { get; internal set; }
    public string Bookings { get; internal set; }
    public string Badge { get; internal set; }
}
public sealed record ExploreCategory { 
    public string Id { get; set; } 
    public string Label { get; set; }
    public int Count { get; internal set; }
}
 