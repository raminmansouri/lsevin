using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using Quartz.Impl.AdoJobStore.Common;
using static BuildingBlocks.Core.Observability.TelemetryTags.Tracing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class ExploreQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) :IQueryHandler<ExploreQuery, ExploreResponse>
{
    public async Task<Result<ExploreResponse>> Handle(
        ExploreQuery request,
        CancellationToken cancellationToken
    )
    {

        Console.WriteLine("Explore Query called");
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        /*
             var categories = new List<ExploreCategory>() {
         new ExploreCategory()
         {
             Id= "all",
             Label= "All Services",
             Count= 1248
         },
         new ExploreCategory(){ Id= "medical", Label= "Medical", Count= 482 },
         new ExploreCategory(){ Id= "beauty", Label= "Beauty & Spa", Count= 231 },
         new ExploreCategory(){ Id= "fitness", Label= "Fitness", Count= 156 },
         new ExploreCategory(){ Id= "hotels", Label= "Hotels", Count= 189 },
         new ExploreCategory(){ Id= "pharmacy", Label= "Pharmacy", Count= 92 },
         new ExploreCategory(){ Id= "education", Label= "Education", Count= 98 },
       };

             var featuredProviders = new List<ExploreFeaturedProvider>() {
        new ExploreFeaturedProvider() {
         Id= 1,
           Name="Istanbul Medical Center",
           Image="/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg",
           Rating=4.9,
           Reviews=2847,
           Verified=true,
           Location="Istanbul, Turkey",
           Specialties=new string[]{"Hair Transplant", "Dental", "Plastic Surgery"},
           ResponseTime="< 1 hour",
           Bookings="15k+ bookings",
           Badge="Top Rated"
         },
         new ExploreFeaturedProvider(){
         Id= 2,
           Name="Dubai Smile Clinic",
           Image="/unsplash_images/photo-1629909613654-28e377c37b09__w=600&h=400&fit=crop.jpg",
           Rating=4.9,
           Reviews=1523,
           Verified=true,
           Location="Dubai, UAE",
           Specialties=new string[]{"Dental Veneers", "Implants", "Orthodontics"},
           ResponseTime="< 30 min",
           Bookings="8k+ bookings",
           Badge="Premium"
         },
         new ExploreFeaturedProvider(){
         Id= 3,
           Name="Bali Wellness Resort",
           Image="/unsplash_images/photo-1540555700478-4be289fbecef__w=600&h=400&fit=crop.jpg",
           Rating=5.0,
           Reviews=892,
           Verified=true,
           Location="Ubud, Bali",
           Specialties=new string[]{"Wellness", "Spa", "Yoga"},
           ResponseTime="< 2 hours",
           Bookings="3k+ bookings",
           Badge="New"
         },
         new ExploreFeaturedProvider(){
         Id= 4,
           Name="Cyprus Fertility Center",
           Image="/unsplash_images/photo-1551190822-a9333d879b1f__w=600&h=400&fit=crop.jpg",
           Rating=4.8,
           Reviews=456,
           Verified=true,
           Location="Nicosia, Cyprus",
           Specialties=new string[]{"IVF", "Fertility", "Gynecology"},
           ResponseTime="< 1 hour",
           Bookings="2k+ bookings",
           Badge="Verified"
         },
         new ExploreFeaturedProvider(){
         Id= 5,
           Name="Bangkok Aesthetic Clinic",
           Image="/unsplash_images/photo-1512678080530-7760d81faba6__w=600&h=400&fit=crop.jpg",
           Rating=4.9,
           Reviews=1289,
           Verified=true,
           Location="Bangkok, Thailand",
           Specialties=new string[]{"Cosmetic Surgery", "Botox", "Fillers"},
           ResponseTime="< 30 min",
           Bookings="12k+ bookings",
           Badge="Top Rated"
         },
         new ExploreFeaturedProvider(){
         Id= 6,
           Name="Vienna Dental Excellence",
           Image="/unsplash_images/photo-1588776814546-1ffcf47267a5__w=600&h=400&fit=crop.jpg",
           Rating=4.9,
           Reviews=734,
           Verified=true,
           Location="Vienna, Austria",
           Specialties=new string[]{"Dental", "Implants", "Cosmetic"},
           ResponseTime="< 1 hour",
           Bookings="5k+ bookings",
           Badge="Premium"
         },
       };

             var trendingServices = new List<ExploreTrendingService>() {
         new ExploreTrendingService(){
           Id= 1,
           Name="Hair Transplant Package",
           Provider="Istanbul Medical Center",
           Image="/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg",
           Price=2499,
           OriginalPrice=3200,
           Rating=4.9,
           Reviews=847,
           Growth="+45%",
           Location="Istanbul, Turkey"
         },
         new ExploreTrendingService(){
           Id= 2,
           Name="Hollywood Smile Veneers",
           Provider="Dubai Smile Clinic",
           Image="/unsplash_images/photo-1588776814546-1ffcf47267a5__w=600&h=400&fit=crop.jpg",
           Price=3200,
           OriginalPrice=4500,
           Rating=4.9,
           Reviews=523,
           Growth="+38%",
           Location="Dubai, UAE"
         },
         new ExploreTrendingService(){
           Id= 3,
           Name="IVF Treatment Cycle",
           Provider="Cyprus Fertility Center",
           Image="/unsplash_images/photo-1584515979956-d9f6e5d09982__w=600&h=400&fit=crop.jpg",
           Price=3800,
           Rating=4.8,
           Reviews=234,
           Growth="+32%",
           Location="Nicosia, Cyprus"
         },
         new ExploreTrendingService(){
           Id= 4,
           Name="Full Body Checkup",
           Provider="Bangkok Medical Center",
           Image="/unsplash_images/photo-1579684385127-1ef15d508118__w=600&h=400&fit=crop.jpg",
           Price=450,
           OriginalPrice=600,
           Rating=4.9,
           Reviews=1523,
           Growth="+28%",
           Location="Bangkok, Thailand"
         },
       };

             var sponsoredProviders = new List<ExploreSponsoredProvider>() {
        new ExploreSponsoredProvider() {
           Id= 1,
           Name="Premium Wellness Retreat",
           Subtitle="7-day detox & rejuvenation",
           Image="/unsplash_images/photo-1544367567-0f2fcb009e0b__w=800&h=400&fit=crop.jpg",
           Price=899,
           Tag="Sponsored"
         },
       };

             var searchHistoryResponse = new ExploreResponse
             {
                 SponsoredProviders = sponsoredProviders,
                 TrendingServices = trendingServices,
                 FeaturedProviders = featuredProviders,
                 Categories = categories
             };*/


        var response= await GetExploreData(cancellationToken);
        return response;
    }
    public static string TrendingSql = @"
SELECT 
    ps.id AS ""Id"",
    common.get_translation_t(ps.display_name_translations, 'en', 'en') AS ""Name"",
    common.get_translation_t(sp.name_translations, 'en', 'en') AS ""Provider"",
    COALESCE(
        NULLIF(BTRIM(ps.image_url), ''),
        pgi.url
    ) AS ""Image"",
    ps.value::int AS ""Price"",
    ps.value::int AS ""OriginalPrice"",
    ps.rating::float AS ""Rating"",
    ps.review_count AS ""Reviews"",
    CASE
        WHEN ps.growth IS NULL OR BTRIM(ps.growth) = '' THEN NULL
        WHEN substring(ps.growth from '[-+]?[0-9]*\.?[0-9]+') IS NULL THEN NULL
        ELSE (substring(ps.growth from '[-+]?[0-9]*\.?[0-9]+'))::float
    END AS ""Growth"",
    TRIM(
        CONCAT_WS(', ',
            NULLIF(common.get_translation_t(city_loc.value_translations, 'en', 'en'), ''),
            NULLIF(common.get_translation_t(country_loc.value_translations, 'en', 'en'), '')
        )
    ) AS ""Location""
FROM category.provider_services ps
JOIN category.service_providers sp 
    ON sp.id = ps.service_provider_id
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
LEFT JOIN LATERAL (
    SELECT gi.url
    FROM category.provider_gallery_items gi
    WHERE gi.service_provider_id = ps.service_provider_id
    ORDER BY gi.display_order ASC, gi.create_date ASC
    LIMIT 1
) pgi ON TRUE
WHERE ps.is_active = TRUE
ORDER BY 
    COALESCE(ps.trending_score, 0) DESC,
    COALESCE(ps.review_count, 0) DESC,
    ps.create_date DESC
LIMIT 10;";

    public static string FeaturedSql = @"
SELECT 
    sp.id AS ""Id"",
    common.get_translation_t(sp.name_translations, 'en', 'en') AS ""Name"",
    COALESCE(
        pgi.url,
        sp.image_url
    ) AS ""Image"",
    sp.rating::float AS ""Rating"",
    sp.review_count AS ""Reviews"",
    sp.accredited AS ""Verified"",
    TRIM(
        CONCAT_WS(', ',
            NULLIF(common.get_translation_t(city_loc.value_translations, 'en', 'en'), ''),
            NULLIF(common.get_translation_t(country_loc.value_translations, 'en', 'en'), '')
        )
    ) AS ""Location"",
    sp.response_time AS ""ResponseTime"",
    sp.total_patients AS ""Bookings"",
    sp.success_rate AS ""Badge""
FROM category.service_providers sp
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
LEFT JOIN LATERAL (
    SELECT g.url
    FROM category.provider_gallery_items g
    WHERE g.service_provider_id = sp.id
    ORDER BY g.display_order ASC, g.create_date ASC
    LIMIT 1
) pgi ON TRUE
WHERE sp.is_active = TRUE
ORDER BY 
    COALESCE(sp.featured_score, 0) DESC,
    COALESCE(sp.rating, 0) DESC,
    COALESCE(sp.review_count, 0) DESC,
    sp.create_date DESC
LIMIT 10;";

    public static string SponsoredSql = @"
SELECT 
    sp.id AS ""Id"",
    common.get_translation_t(sp.name_translations, 'en', 'en') AS ""Name"",
    common.get_translation_t(sp.description_translations, 'en', 'en') AS ""Subtitle"",
    COALESCE(
        NULLIF(BTRIM(ps_pick.image_url), ''),
        pgi.url,
        sp.image_url
    ) AS ""Image"",
    ps_pick.value::int AS ""Price"",
    sp.sponsored_tag AS ""Tag""
FROM category.service_providers sp
LEFT JOIN LATERAL (
    SELECT ps.value, ps.image_url
    FROM category.provider_services ps
    WHERE ps.service_provider_id = sp.id
      AND ps.is_active = TRUE
    ORDER BY 
        COALESCE(ps.is_popular, FALSE) DESC,
        COALESCE(ps.rating, 0) DESC,
        COALESCE(ps.review_count, 0) DESC,
        ps.create_date DESC
    LIMIT 1
) ps_pick ON TRUE
LEFT JOIN LATERAL (
    SELECT g.url
    FROM category.provider_gallery_items g
    WHERE g.service_provider_id = sp.id
    ORDER BY g.display_order ASC, g.create_date ASC
    LIMIT 1
) pgi ON TRUE
WHERE sp.is_sponsored = TRUE
ORDER BY 
    COALESCE(sp.featured_score, 0) DESC,
    COALESCE(sp.rating, 0) DESC,
    sp.create_date DESC
LIMIT 10;";


    public static string CategoriesSql = @"
SELECT 
    c.id AS ""Id"",
    common.get_translation_t(c.name_translations, 'en', 'en') AS ""Label"",
    COUNT(sd.id) AS ""Count""
FROM category.categories c
LEFT JOIN category.service_definitions sd 
    ON sd.category_id = c.id
GROUP BY 
    c.id,
    common.get_translation_t(c.name_translations, 'en', 'en')
ORDER BY COUNT(sd.id) DESC;";

    public async Task<ExploreResponse> GetExploreData(CancellationToken cancellationToken)
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var trending = await connection.QueryAsync<ExploreTrendingService>(TrendingSql);
        var featured = await connection.QueryAsync<ExploreFeaturedProvider>(FeaturedSql);
        var sponsored = await connection.QueryAsync<ExploreSponsoredProvider>(SponsoredSql);
        var categories = await connection.QueryAsync<ExploreCategory>(CategoriesSql);

        return new ExploreResponse
        {
            TrendingServices = trending.ToList(),
            FeaturedProviders = featured.ToList(),
            SponsoredProviders = sponsored.ToList(),
            Categories = categories.ToList()
        };
       
    }
}

