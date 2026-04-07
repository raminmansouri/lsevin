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
}

