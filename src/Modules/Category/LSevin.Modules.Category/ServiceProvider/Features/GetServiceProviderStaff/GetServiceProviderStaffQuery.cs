using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderStaff;

internal sealed record GetServiceProviderStaffQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<IReadOnlyCollection<GetServiceProviderStaffResponse>>
{
    public static GetServiceProviderStaffQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
