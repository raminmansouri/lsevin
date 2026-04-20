using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Customer.Customer.Features.GetFavorites;
using QuickType;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetFavoritesQuery(

PageRequest pageRequest, GetFavoritesRequest exploreRequest)
    : Query<GetFavoritesResponse>
{

    internal static GetFavoritesQuery? Of(PageRequest pageRequest, GetFavoritesRequest exploreRequest)
        => new GetFavoritesQuery(pageRequest, exploreRequest);
}
