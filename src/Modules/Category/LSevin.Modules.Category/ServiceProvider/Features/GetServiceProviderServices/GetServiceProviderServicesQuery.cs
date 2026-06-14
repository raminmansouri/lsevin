using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderServices;

internal sealed record GetServiceProviderServicesQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<IReadOnlyCollection<GetServiceProviderServicesResponse>>
{
    public static GetServiceProviderServicesQuery Of(GetServiceProviderServicesRequest request) =>
        new(request.ServiceProviderId, request.IsActive);
}
