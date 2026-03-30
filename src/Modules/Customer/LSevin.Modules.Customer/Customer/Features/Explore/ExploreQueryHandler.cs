using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

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
        };



        return searchHistoryResponse;
    }
}

