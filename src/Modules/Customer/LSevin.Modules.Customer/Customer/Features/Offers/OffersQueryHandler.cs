using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.Data;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class OffersQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) :IQueryHandler<OffersQuery, OffersResponse>
{
    public async Task<Result<OffersResponse>> Handle(
        OffersQuery request,
        CancellationToken cancellationToken
    )
    {

        Console.WriteLine("Offers Query called");
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

   
        var searchHistoryResponse = new OffersResponse
        {
            Offers=StaticOffers,
            Categories=GetOfferCategories()
        };



        return searchHistoryResponse;
    }

    // Static offers list – copied from the question.
    private static readonly List<OfferDto> StaticOffers = new()
    {
       new OfferDto()
            {
                Id = 1,
                Title = "20% Off Premium Packages",
                Subtitle = "First-time bookings only",
                Provider = "Istanbul Medical Center",
                Category = "medical",
                Image = "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg",
                Discount = 20.0m,
                ValidUntil = "Mar 15, 2026",
                Code = "FIRST20",
                Verified = true,
                Location = "Istanbul, Turkey",
                Rating = 4.9m,
                OriginalPrice = 2499.0m,
                DiscountedPrice = 1999.0m
            },
            new OfferDto()
            {
                Id = 2,
                Title = "Buy 2 Get 1 Free Laser Sessions",
                Subtitle = "Limited time offer",
                Provider = "Elite Beauty Clinic Dubai",
                Category = "beauty",
                Image = "/unsplash_images/photo-1540555700478-4be289fbecef__w=600&h=400&fit=crop.jpg",
                Discount = 33.0m,
                ValidUntil = "Mar 20, 2026",
                Code = "LASER3FOR2",
                Verified = true,
                Location = "Dubai, UAE",
                Rating = 4.8m,
                OriginalPrice = 900.0m,
                DiscountedPrice = 600.0m
            },
            new OfferDto()
            {
                Id = 3,
                Title = "30% Off Annual Gym Membership",
                Subtitle = "New members only",
                Provider = "FitZone Premium Gym",
                Category = "fitness",
                Image = "/unsplash_images/photo-1534438327276-14e5300c3a48__w=600&h=400&fit=crop.jpg",
                Discount = 30.0m,
                ValidUntil = "Mar 25, 2026",
                Code = "GYM30",
                Verified = true,
                Location = "Dubai, UAE",
                Rating = 4.7m,
                OriginalPrice = 1200.0m,
                DiscountedPrice = 840.0m
            },
            new OfferDto()
{
                Id = 4,
                Title = "Free Consultation + 15% Off",
                Subtitle = "Dental treatments",
                Provider = "SmileCare Dental Clinic",
                Category = "medical",
                Image = "/unsplash_images/photo-1606811971618-4486d14f3f99__w=600&h=400&fit=crop.jpg",
                Discount = 15.0m,
                ValidUntil = "Mar 18, 2026",
                Code = "SMILE15",
                Verified = true,
                Location = "Istanbul, Turkey",
                Rating = 4.9m,
                OriginalPrice = 500.0m,
                DiscountedPrice = 425.0m
            },
            new OfferDto()
{
                Id = 5,
                Title = "Spa Day Package - 25% Off",
                Subtitle = "Includes massage, facial & more",
                Provider = "Serenity Wellness Spa",
                Category = "beauty",
                Image = "/unsplash_images/photo-1544161515-4ab6ce6db874__w=600&h=400&fit=crop.jpg",
                Discount = 25.0m,
                ValidUntil = "Mar 22, 2026",
                Code = "SPA25",
                Verified = true,
                Location = "Dubai, UAE",
                Rating = 4.8m,
                OriginalPrice = 400.0m,
                DiscountedPrice = 300.0m
            },
            new OfferDto()
{
                Id = 6,
                Title = "40% Off First Personal Training Session",
                Subtitle = "Professional trainers",
                Provider = "PowerFit Personal Training",
                Category = "fitness",
                Image = "/unsplash_images/photo-1571019613454-1cb2f99b2d8b__w=600&h=400&fit=crop.jpg",
                Discount = 40.0m,
                ValidUntil = "Mar 30, 2026",
                Code = "PT40",
                Verified = true,
                Location = "Dubai, UAE",
                Rating = 4.9m,
                OriginalPrice = 150.0m,
                DiscountedPrice = 90.0m
            }
        // Add more OfferDto here …
    };

    public record OfferCategory
    {
        public string Id { get; set; }
        public string Label { get; set; }
        public int Count { get; set; }
    }

    public static OfferCategory[] GetOfferCategories()
    {
        return new OfferCategory[]
        {
           new OfferCategory { Id = "Offers.ALL", Label = "All Offers", Count = 5 },
           new OfferCategory { Id = "Offers.MEDICAL", Label = "Medical",
              Count = 4 },
           new OfferCategory { Id =" Offers/beauty", Label = "Beauty & Spa",
              Count = 3 },
           new OfferCategory { Id = "Offers.FITNESS", Label = "Fitness",
              Count = 5 }
        };
    }


    public static string DapperSQL = @"
SELECT 
    o.id                         AS ""Id"",
    o.title                      AS ""Title"",
    o.subtitle                   AS ""Subtitle"",

    sp.name_translations->>'en'  AS ""Provider"",

    c.name_translations->>'en'   AS ""Category"",

    ps.image_url                 AS ""Image"",

    o.discount_percent           AS ""Discount"",

    o.valid_until::date::text    AS ""ValidUntil"",

    o.code                       AS ""Code"",

    sp.is_verified               AS ""Verified"",

    sp.city || ', ' || sp.country AS ""Location"",

    sp.rating::decimal           AS ""Rating"",

    ps.value::decimal            AS ""OriginalPrice"",

    ROUND(
        ps.value * (1 - o.discount_percent / 100.0), 
        2
    )                            AS ""DiscountedPrice""

FROM marketing.offers o

JOIN category.provider_services ps 
    ON ps.id = o.provider_service_id

JOIN category.service_providers sp 
    ON sp.id = ps.service_provider_id

LEFT JOIN category.service_definitions sd 
    ON sd.id = ps.service_definition_id

LEFT JOIN category.categories c 
    ON c.id = sd.category_id

WHERE 
    o.is_active = TRUE
    AND o.valid_until > now()

ORDER BY o.valid_until ASC;";


    public static string CategorySQL = @"
SELECT 
    c.id::text AS ""Id"",
    c.name_translations->>'en' AS ""Label"",
    COUNT(o.id) AS ""Count""
FROM marketing.offers o
JOIN category.provider_services ps 
    ON ps.id = o.provider_service_id
JOIN category.service_definitions sd 
    ON sd.id = ps.service_definition_id
JOIN category.categories c 
    ON c.id = sd.category_id
WHERE o.is_active = TRUE
GROUP BY c.id;";


    public async Task<OffersResponse> GetOffers(IDbConnection db)
    {
        var offersSql = DapperSQL;
        var categoriesSql = CategorySQL;

        var offers = (await db.QueryAsync<OfferDto>(offersSql)).ToList();

        var categories = (await db.QueryAsync<OffersQueryHandler.OfferCategory>(
            categoriesSql
        )).ToArray();

        return new OffersResponse
        {
            Offers = offers,
            Categories = categories
        };
    }


}

