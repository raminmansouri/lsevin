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

internal sealed class GetSearchResultsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
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
  };

        var searchHistoryResponse = new GetSearchResultsResponse
        {
            Results = results,
            Filters = filters,
            Categories = categories
        };



        return searchHistoryResponse;
    }
}

