using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevinModels.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Internal;
using System.Data;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetSearchResultsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IDbContextFactory<LsevinContext> contextFactory,
    IUserAccessor userAccessor,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetSearchResultsQuery, GetSearchResultsResponse>
{
    public async Task<Result<GetSearchResultsResponse>> Handle(
        GetSearchResultsQuery request,
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
                var categories = new List<SearchResultCategory>() {
           new SearchResultCategory() { Id= "all", Label= "All Results" },
           new SearchResultCategory() { Id= "clinics", Label= "Clinics" },
           new SearchResultCategory() { Id= "treatments", Label= "Treatments" },
           new SearchResultCategory() { Id= "doctors", Label= "Doctors" },
           new SearchResultCategory() { Id= "packages", Label= "Packages" }
          };



                var filters = new List<SearchResultFilters>() {
           new SearchResultFilters() { Id= "Verified Only", Label= "Verified Only" },
           new SearchResultFilters() { Id= "4+ Stars", Label= "4+ Stars" },
          };


                var results = new List<SearchResultItem>() {
             new SearchResultItem{
              Id= 1,
              Type= "treatment",
              Name= "Premium Hair Transplant Package",
              Provider= "Istanbul Medical Center",
              Image= "/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg",
              Location= "Istanbul, Turkey",
              Rating= 4.9,
              Reviews= 2847,
              Price= 2499,
              OriginalPrice= 3200,
              Verified= true,
              Tags= new string[]{"All-Inclusive", "Best Value" }
            },
            new SearchResultItem{
              Id= 2,
              Type= "clinic",
              Name= "Dubai Smile Clinic",
              Provider= "Dental Excellence",
              Image= "/unsplash_images/photo-1629909613654-28e377c37b09__w=600&h=400&fit=crop.jpg",
              Location= "Dubai, UAE",
              Rating= 4.9,
              Reviews= 1523,
              Verified= true,
              Specialties= new string [] {"Veneers", "Implants", "Whitening" }
            },
            new SearchResultItem{
              Id= 3,
              Type= "treatment",
              Name= "IVF Treatment Complete Cycle",
              Provider= "Cyprus Fertility Center",
              Image= "/unsplash_images/photo-1584515979956-d9f6e5d09982__w=600&h=400&fit=crop.jpg",
              Location= "Nicosia, Cyprus",
              Rating= 4.8,
              Reviews= 456,
              Price= 3800,
              Verified= true,
              Tags= new string[]{"Premium" }
            },
            new SearchResultItem{
              Id= 4,
              Type= "treatment",
              Name= "Hollywood Smile Veneers",
              Provider= "Bangkok Dental Studio",
              Image= "/unsplash_images/photo-1588776814546-1ffcf47267a5__w=600&h=400&fit=crop.jpg",
              Location= "Bangkok, Thailand",
              Rating= 4.9,
              Reviews= 892,
              Price= 2800,
              OriginalPrice= 3500,
              Verified= true,
              Tags= new string[]{"Top Rated" }
            },
            new SearchResultItem{
              Id= 5,
              Type= "clinic",
              Name= "Bali Wellness Resort",
              Provider= "Holistic Health",
              Image= "/unsplash_images/photo-1540555700478-4be289fbecef__w=600&h=400&fit=crop.jpg",
              Location= "Ubud, Bali",
              Rating= 5.0,
              Reviews= 234,
              Verified= true,
              Specialties= ["Spa", "Yoga", "Detox"]
            }
          };*/

        /*   var searchHistoryResponse = new GetSearchResultsResponse
           {
               Results = results,
               Filters = filters,
               Categories = categories
           };

   */

        using (var context = contextFactory.CreateDbContext())
        {
            if(!context.UserSearchHistories.Any(
                s=>s.Term==request.term &&
                s.UserId == userAccessor.GetUserIdentity.ToString()
                ))
            {
                context.UserSearchHistories.Add(new UserSearchHistory
                {
                    Term = request.term,
                    UserId = userAccessor.GetUserIdentity.ToString(),
                    NormalizedTerm = request.term.Trim(),
                });
            }
           
        }


        var response = await Search(connection, request.term, userAccessor.GetUserIdentity.ToString());

        return response;
    }


    public static string DapperSQL = @"
SELECT 
    ps.id::int                    AS ""Id"",
    'service'                     AS ""Type"",
    ps.display_name_translations->>'en' AS ""Name"",
    sp.name_translations->>'en'   AS ""Provider"",

    ps.image_url                  AS ""Image"",
    sp.city || ', ' || sp.country AS ""Location"",

    ps.rating::float              AS ""Rating"",
    ps.review_count               AS ""Reviews"",

    ps.value::int                 AS ""Price"",
    ps.value::int                 AS ""OriginalPrice"",

    sp.is_verified                AS ""Verified"",

    ps.tags                       AS ""Tags"",
    sp.specialties                AS ""Specialties"",

    c.id::text                    AS ""CategoryId"",
    c.name_translations->>'en'    AS ""CategoryLabel""

FROM category.provider_services ps

JOIN category.service_providers sp 
    ON sp.id = ps.service_provider_id

LEFT JOIN category.service_definitions sd 
    ON sd.id = ps.service_definition_id

LEFT JOIN category.categories c 
    ON c.id = sd.category_id

WHERE 
    ps.search_vector @@ plainto_tsquery('english', @Term)

UNION ALL

SELECT 
    sp.id::int                    AS ""Id"",
    'provider'                    AS ""Type"",
    sp.name_translations->>'en'   AS ""Name"",
    sp.name_translations->>'en'   AS ""Provider"",

    (
        SELECT url FROM category.provider_gallery_items g 
        WHERE g.service_provider_id = sp.id LIMIT 1
    )                             AS ""Image"",

    sp.city || ', ' || sp.country AS ""Location"",

    sp.rating::float              AS ""Rating"",
    sp.review_count               AS ""Reviews"",

    0                             AS ""Price"",
    0                             AS ""OriginalPrice"",

    sp.is_verified                AS ""Verified"",

    NULL                          AS ""Tags"",
    sp.specialties                AS ""Specialties"",

    NULL                          AS ""CategoryId"",
    NULL                          AS ""CategoryLabel""

FROM category.service_providers sp

WHERE 
    sp.search_vector @@ plainto_tsquery('english', @Term)

LIMIT 30;";


    public async Task<GetSearchResultsResponse> Search(
    IDbConnection db,
    string term,
    string userId)
    {
        var sql = DapperSQL;

        var results = (await db.QueryAsync<SearchResultItem>(
            sql,
            new { Term = term }
        )).ToList();

        // 🧩 Categories (distinct from results)
        var categories = results
            .Where(x => x.Type == "service")
            .Select(x => new SearchResultCategory
            {
                Id = (x as dynamic).CategoryId,
                Label = (x as dynamic).CategoryLabel
            })
            .Where(x => x.Id != null)
            .GroupBy(x => x.Id)
            .Select(g => g.First())
            .ToList();

        // 🎯 Filters (static for now, can be dynamic later)
        var filters = new List<SearchResultFilters>
    {
        new() { Id = "verified", Label = "Verified" },
        new() { Id = "top_rated", Label = "Top Rated" },
        new() { Id = "low_price", Label = "Lowest Price" }
    };

        // 🕘 Recent Searches
        var recentSql = @"
        SELECT term
        FROM search.user_search_history
        WHERE user_id = @UserId
        ORDER BY created_at DESC
        LIMIT 5;
    ";

        var recent = (await db.QueryAsync<string>(
            recentSql,
            new { UserId = userId }
        )).ToArray();

        return new GetSearchResultsResponse
        {
            Results = results,
            Categories = categories,
            Filters = filters,
            RecentSearches = recent
        };
    }
}

