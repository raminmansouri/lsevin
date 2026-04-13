using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;

internal sealed record GetBookingSpecialistByProviderAndServiceQuery()
    : Query<GetBookingSpecialistByProviderAndServiceResponse>
{
    public static GetBookingSpecialistByProviderAndServiceQuery Of() =>
        new();
}
