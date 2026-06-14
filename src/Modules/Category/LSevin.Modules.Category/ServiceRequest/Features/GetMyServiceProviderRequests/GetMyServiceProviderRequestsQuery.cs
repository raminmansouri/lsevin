using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetMyServiceProviderRequests;

internal sealed record GetMyServiceProviderRequestsQuery(Guid ServiceProviderId)
    : IQuery<IReadOnlyCollection<GetMyServiceProviderRequestsResponse>>
{
    public static GetMyServiceProviderRequestsQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
