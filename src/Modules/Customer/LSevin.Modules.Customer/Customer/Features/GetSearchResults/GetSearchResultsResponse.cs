using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

public sealed record GetSearchResultsResponse
{
    public string[] RecentSearches { get; internal set; }
    public List<SearchResultItem> Results { get; internal set; }
    public List<SearchResultCategory> Categories { get; internal set; }
    public List<SearchResultFilters> Filters { get; internal set; }
}

public sealed record SearchResultCategory
{
    public string Id { get; internal set; }
    public string Label { get; internal set; }
}


public sealed record SearchResultFilters
{
    public string Id { get; internal set; }
    public string Label { get; internal set; }
}

public sealed record SearchResultItem
{
    public int Id { get; internal set; }
    public string Type { get; internal set; }
    public string Name { get; internal set; }
    public string Provider { get; internal set; }
    public string Image { get; internal set; }
    public string Location { get; internal set; }
    public double Rating { get; internal set; }
    public int Reviews { get; internal set; }
    public int Price { get; internal set; }
    public int OriginalPrice { get; internal set; }
    public bool Verified { get; internal set; }
    public object Tags { get; internal set; }
    public string[] Specialties { get; internal set; }
}

