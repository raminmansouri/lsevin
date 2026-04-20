using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderPageData;

internal sealed record GetProviderPageDataQuery(Guid providerId)
    : Query<ProviderDataResponse>
{
    public static GetProviderPageDataQuery Of(Guid id) => new(id);
}
