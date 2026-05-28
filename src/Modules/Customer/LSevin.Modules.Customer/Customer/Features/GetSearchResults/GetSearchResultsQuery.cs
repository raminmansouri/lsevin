using BuildingBlocks.Core.Messaging.Queries;
using System.ComponentModel.DataAnnotations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetSearchResultsQuery([MaxLength(200)] string term)
    : Query<GetSearchResultsResponse>
{
    public static GetSearchResultsQuery Of([MaxLength(200)] string term) => new(term);
}
