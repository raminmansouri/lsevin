using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

internal sealed record GetBookingGetServicesByProviderAndSpecialistQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<GetBookingGetServicesByProviderAndSpecialistResponse>
{
    public static GetBookingGetServicesByProviderAndSpecialistQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
