using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;

internal sealed record GetBookingSpecialistByProviderAndServiceQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<GetBookingSpecialistByProviderAndServiceResponse>
{
    public static GetBookingSpecialistByProviderAndServiceQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
