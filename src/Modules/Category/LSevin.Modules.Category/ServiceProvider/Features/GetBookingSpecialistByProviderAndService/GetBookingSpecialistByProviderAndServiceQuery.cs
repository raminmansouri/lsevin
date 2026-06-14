using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;

internal sealed record GetBookingSpecialistByProviderAndServiceQuery(Guid? providerId,
Guid? serviceId,
 Guid? specialistId)
    : Query<GetBookingSpecialistByProviderAndServiceResponse>
{
    public static GetBookingSpecialistByProviderAndServiceQuery Of(Guid? providerId,
Guid? serviceId,
 Guid? specialistId) =>
        new(providerId,
    serviceId,
    specialistId);
}
