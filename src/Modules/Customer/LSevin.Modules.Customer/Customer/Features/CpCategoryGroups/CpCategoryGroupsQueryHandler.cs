using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevin.Modules.Customer.Customer.Features.Explore;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class CpCategoryGroupsQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<CpCategoryGroupsQuery, CpCategoryGroupsResponse>
{
    public async Task<Result<CpCategoryGroupsResponse>> Handle(
        CpCategoryGroupsQuery request,
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




        var cat1 = new List<CpCategory>
      {
          new CpCategory()
        {
            Name="Hair Transplant",
          Image="/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg",
          Count=142,
          Gradient="from-red-500/90 to-red-600/90"
        },
          new CpCategory()
        {
            Name="Dental Care",
          Image="/unsplash_images/photo-1606811971618-4486d14f3f99__w=400&h=300&fit=crop.jpg",
          Count=198,
          Gradient="from-blue-500/90 to-blue-600/90"
        },
          new CpCategory()
        {
            Name="IVF & Fertility",
          Image="/unsplash_images/photo-1584515979956-d9f6e5d09982__w=400&h=300&fit=crop.jpg",
          Count=67,
          Gradient="from-pink-500/90 to-pink-600/90"
        },
          new CpCategory()
        {
            Name="Plastic Surgery",
          Image="/unsplash_images/photo-1512678080530-7760d81faba6__w=400&h=300&fit=crop.jpg",
          Count=89,
          Gradient="from-purple-500/90 to-purple-600/90"
        },
          new CpCategory()
        {
            Name="Eye Surgery",
          Image="/unsplash_images/photo-1585435557343-3b092031a831__w=400&h=300&fit=crop.jpg",
          Count=54,
          Gradient="from-cyan-500/90 to-cyan-600/90"
        },
          new CpCategory()
        {
            Name="Orthopedics",
          Image="/unsplash_images/photo-1579684385127-1ef15d508118__w=400&h=300&fit=crop.jpg",
          Count=76,
          Gradient="from-green-500/90 to-green-600/90"
        },
      };
        var response = new CpCategoryGroupsResponse()
        {
            CategoryGroups = new List<CpGroup>() {
     new CpGroup() {
         Title = "Medical Services",
         Categories = cat1
     },
    new CpGroup() {
        Title = "Beauty & Wellness",
        Categories =
        new List<CpCategory>(){
          new CpCategory()
        {
            Name="Spa & Massage",
          Image="/unsplash_images/photo-1540555700478-4be289fbecef__w=400&h=300&fit=crop.jpg",
          Count=124,
          Gradient="from-emerald-500/90 to-emerald-600/90"
        },
          new CpCategory()
        {
            Name="Hair Salon",
          Image="/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg",
          Count=156,
          Gradient="from-rose-500/90 to-rose-600/90"
        },
          new CpCategory()
        {
            Name="Skin Care",
          Image="/unsplash_images/photo-1570172619644-dfd03ed5d881__w=400&h=300&fit=crop.jpg",
          Count=92,
          Gradient="from-amber-500/90 to-amber-600/90"
        },
          new CpCategory()
        {
            Name="Nail Studio",
          Image="/unsplash_images/photo-1604654894610-df63bc536371__w=400&h=300&fit=crop.jpg",
          Count=78,
          Gradient="from-pink-500/90 to-pink-600/90"
        },
      }
    },
    new CpGroup() {
        Title = "Fitness & Sports",
        Categories =
        new List<CpCategory>(){
          new CpCategory()
            {
            Name="Gym & Fitness",
          Image="/unsplash_images/photo-1534438327276-14e5300c3a48__w=400&h=300&fit=crop.jpg",
          Count=89,
          Gradient="from-orange-500/90 to-orange-600/90"
        },
          new CpCategory()
        {
            Name="Yoga Studio",
          Image="/unsplash_images/photo-1544367567-0f2fcb009e0b__w=400&h=300&fit=crop.jpg",
          Count=45,
          Gradient="from-purple-500/90 to-purple-600/90"
        },
          new CpCategory()
        {
            Name="Personal Training",
          Image="/unsplash_images/photo-1571019614242-c5c5dee9f50b__w=400&h=300&fit=crop.jpg",
          Count=67,
          Gradient="from-red-500/90 to-red-600/90"
        },
          new CpCategory()
        {
            Name="Pilates",
          Image="/unsplash_images/photo-1518611012118-696072aa579a__w=400&h=300&fit=crop.jpg",
          Count=34,
          Gradient="from-teal-500/90 to-teal-600/90"
        },
      }
    },
    new CpGroup() {
        Title = "Hospitality",
        Categories =
        new List<CpCategory>(){
          new CpCategory()
        {
            Name="Hotels",
          Image="/unsplash_images/photo-1566073771259-6a8506099945__w=400&h=300&fit=crop.jpg",
          Count=189,
          Gradient="from-blue-500/90 to-blue-600/90"
        },
          new CpCategory()
        {
            Name="Resorts",
          Image="/unsplash_images/photo-1520250497591-112f2f40a3f4__w=400&h=300&fit=crop.jpg",
          Count=98,
          Gradient="from-cyan-500/90 to-cyan-600/90"
        },
          new CpCategory()
        {
            Name="Wellness Retreats",
          Image="/unsplash_images/photo-1545205597-3d9d02c29597__w=400&h=300&fit=crop.jpg",
          Count=56,
          Gradient="from-emerald-500/90 to-emerald-600/90"
        },
      }
    },
    new CpGroup {
        Title = "Other Services",
        Categories =
       new List<CpCategory>() {
          new CpCategory()
        {
            Name="Pharmacy",
          Image="/unsplash_images/photo-1576602976047-174e57a47881__w=400&h=300&fit=crop.jpg",
          Count=92,
          Gradient="from-teal-500/90 to-teal-600/90"
        },
          new CpCategory()
        {
            Name="Health Education",
          Image="/unsplash_images/photo-1523240795612-9a054b0db644__w=400&h=300&fit=crop.jpg",
          Count=45,
          Gradient="from-indigo-500/90 to-indigo-600/90"
        },
          new CpCategory()
        {
            Name="Medical Tourism",
          Image="/unsplash_images/photo-1469854523086-cc02fe5d8800__w=400&h=300&fit=crop.jpg",
          Count=234,
          Gradient="from-violet-500/90 to-violet-600/90"
        },
      }
    }
  }
        };


        return response;
    }
}

