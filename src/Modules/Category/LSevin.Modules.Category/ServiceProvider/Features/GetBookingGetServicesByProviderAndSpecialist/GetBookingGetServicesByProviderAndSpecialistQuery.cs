using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

internal sealed record GetBookingGetServicesByProviderAndSpecialistQuery()
    : Query<GetBookingGetServicesByProviderAndSpecialistResponse>
{
    public static GetBookingGetServicesByProviderAndSpecialistQuery Of() =>
        new();
}
