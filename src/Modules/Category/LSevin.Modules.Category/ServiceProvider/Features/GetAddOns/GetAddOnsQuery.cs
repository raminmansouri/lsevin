using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAddOns;

internal sealed record GetAddOnsQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<AddonListResponse>
{
    public static GetAddOnsQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
