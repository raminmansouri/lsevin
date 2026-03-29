using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetSearchHistoryQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetSearchHistoryQuery, GetSearchHistoryResponse>
{
    public async Task<Result<GetSearchHistoryResponse>> Handle(
        GetSearchHistoryQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;



        var trendingSearches = new List<SearchHistoryTrendingSearchesVm>() {
    new SearchHistoryTrendingSearchesVm { Query= "Hair Transplant", Trend= "+45%" },
    new SearchHistoryTrendingSearchesVm { Query= "Dental Veneers", Trend= "+38%" },
    new SearchHistoryTrendingSearchesVm { Query= "IVF Treatment", Trend= "+32%" },
    new SearchHistoryTrendingSearchesVm { Query= "Rhinoplasty", Trend= "+28%" },
    new SearchHistoryTrendingSearchesVm { Query= "Laser Eye Surgery", Trend= "+25%" },
    new SearchHistoryTrendingSearchesVm { Query= "Weight Loss Surgery", Trend= "+22%" },
  };

        var popularCategories = new List<SearchHistoryPopularCategoryVm>()
        {
    new SearchHistoryPopularCategoryVm{ Label= "Medical Tourism", Icon = "🏥" },
    new SearchHistoryPopularCategoryVm { Label= "Dental Care", Icon = "🦷" },
    new SearchHistoryPopularCategoryVm { Label= "Cosmetic Surgery", Icon = "💉" },
    new  SearchHistoryPopularCategoryVm{ Label= "Wellness & Spa", Icon = "🧘" },
    new SearchHistoryPopularCategoryVm{ Label= "Fertility", Icon = "👶" },
    new  SearchHistoryPopularCategoryVm{ Label = "Fitness", Icon = "💪" }
  };
        var searchHistoryResponse = new GetSearchHistoryResponse
        {
            RecentSearches = new string[]
           {
                 "Hair Transplant in Istanbul",
    "Dental Veneers Dubai",
    "IVF Cyprus",
    "Spa Bali"
           },
            PopularCategories = popularCategories,
            TrendingSearches = trendingSearches,
        };



        return searchHistoryResponse;
    }
}

