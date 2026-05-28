using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetSearchHistoryQuery
    : Query<GetSearchHistoryResponse>
{
    public static GetSearchHistoryQuery Of => new();
}
