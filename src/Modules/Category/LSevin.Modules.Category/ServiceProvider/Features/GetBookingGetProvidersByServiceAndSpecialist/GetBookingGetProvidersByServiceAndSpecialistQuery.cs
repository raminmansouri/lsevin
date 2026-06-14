using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;

internal sealed record GetBookingGetProvidersByServiceAndSpecialistQuery(

    Guid?  providerId,
   Guid? serviceId,
    Guid? specialistId
    )
    : Query<GetBookingGetProvidersByServiceAndSpecialistResponse>
{
    public static GetBookingGetProvidersByServiceAndSpecialistQuery Of(Guid? providerId,
   Guid? serviceId,
    Guid? specialistId) =>
        new GetBookingGetProvidersByServiceAndSpecialistQuery(providerId,
    serviceId,
    specialistId);
}
