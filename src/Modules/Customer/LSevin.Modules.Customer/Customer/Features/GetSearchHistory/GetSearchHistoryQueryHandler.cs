using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using BuildingBlocks.Web.Services;
using Dapper;
using System.Data;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetSearchHistoryQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IUserAccessor userAccessor,
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


        /*
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

        */

        var response= await GetSearchHistory(connection,userAccessor.GetUserIdentity.ToString());

        return response;
    }


    public static string TrendingSearches = @"
WITH recent AS (
    SELECT normalized_term, COUNT(*) AS cnt
    FROM search.user_search_history
    WHERE created_at >= now() - interval '7 days'
    GROUP BY normalized_term
),
previous AS (
    SELECT normalized_term, COUNT(*) AS cnt
    FROM search.user_search_history
    WHERE created_at >= now() - interval '14 days'
      AND created_at < now() - interval '7 days'
    GROUP BY normalized_term
)
SELECT 
    r.normalized_term AS ""Query"",
    CONCAT(
        '+',
        ROUND(
            ((r.cnt - COALESCE(p.cnt,0)) * 100.0) / GREATEST(COALESCE(p.cnt,1),1),
            0
        ),
        '%'
    ) AS ""Trend""
FROM recent r
LEFT JOIN previous p 
    ON p.normalized_term = r.normalized_term
ORDER BY r.cnt DESC
LIMIT 6;";


    public static string PopularCategories= @"SELECT 
    c.name_translations->>'en' AS ""Label"",
    c.icon AS ""Icon"",
    COUNT(sh.id) AS usage_count
FROM search.user_search_history sh

JOIN category.categories c 
    ON c.id = sh.category_id

GROUP BY c.id
ORDER BY usage_count DESC
LIMIT 6;";


    public static string RecentSearches = @"
SELECT DISTINCT term
FROM search.user_search_history
WHERE user_id = @UserId
ORDER BY term
LIMIT 5;";



    public async Task<GetSearchHistoryResponse> GetSearchHistory(
    IDbConnection db,
    string userId)
    {
        var recentSql =RecentSearches;
        var trendingSql = TrendingSearches;
        var categoriesSql = PopularCategories;

        var recent = (await db.QueryAsync<string>(
            recentSql,
            new { UserId = userId }
        )).ToArray();

        var trending = (await db.QueryAsync<SearchHistoryTrendingSearchesVm>(
            trendingSql
        )).ToList();

        var categories = (await db.QueryAsync<SearchHistoryPopularCategoryVm>(
            categoriesSql
        )).ToList();

        return new GetSearchHistoryResponse
        {
            RecentSearches = recent,
            TrendingSearches = trending,
            PopularCategories = categories
        };
    }
}

