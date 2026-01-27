using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed record GetServiceProviderByIdPublicQuery(Guid ServiceProviderId)
    : Query<GetServiceProviderByIdPublicResponse>
{
    public static GetServiceProviderByIdPublicQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
