using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsAdmin;

internal sealed record GetServiceProviderRequestsAdminQuery(Guid ServiceProviderId)
    : IQuery<IReadOnlyCollection<GetServiceProviderRequestsAdminResponse>>
{
    public static GetServiceProviderRequestsAdminQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
