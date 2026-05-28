using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

internal sealed record GetBookingGetServicesByProviderAndSpecialistQuery(
     Guid? providerId,
Guid? serviceId,
 Guid? specialistId)
    : Query<GetBookingGetServicesByProviderAndSpecialistResponse>
{
    public static GetBookingGetServicesByProviderAndSpecialistQuery Of(Guid? providerId,
Guid? serviceId,
 Guid? specialistId) =>
        new(providerId,
    serviceId,
    specialistId);
}
