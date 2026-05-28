using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

public sealed record GetSearchHistoryResponse
{
    public string[] RecentSearches { get; internal set; }
    public List<SearchHistoryPopularCategoryVm> PopularCategories { get; internal set; }
    public List<SearchHistoryTrendingSearchesVm> TrendingSearches { get; internal set; }
}

public sealed record SearchHistoryPopularCategoryVm
{
    public string Label { get; set; }
    public string Icon { get; set; }
}


public sealed record SearchHistoryTrendingSearchesVm
{
    public string Trend { get; set; }
    public string Query { get; set; }
}
