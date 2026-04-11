using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;

internal sealed record GetBookingGetProvidersByServiceAndSpecialistQuery(Guid ServiceProviderId, bool? IsActive)
    : Query<GetBookingGetProvidersByServiceAndSpecialistResponse>
{
    public static GetBookingGetProvidersByServiceAndSpecialistQuery Of(Guid serviceProviderId, bool? isActive = null) =>
        new(serviceProviderId, isActive);
}
