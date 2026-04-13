using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;

internal sealed record GetBookingGetProvidersByServiceAndSpecialistQuery()
    : Query<GetBookingGetProvidersByServiceAndSpecialistResponse>
{
    public static GetBookingGetProvidersByServiceAndSpecialistQuery Of() =>
        new GetBookingGetProvidersByServiceAndSpecialistQuery();
}
