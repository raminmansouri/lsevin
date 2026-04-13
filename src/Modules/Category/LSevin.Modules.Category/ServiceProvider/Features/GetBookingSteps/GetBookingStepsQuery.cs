using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Category.ServiceProvider.Features.GetProviderById;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSteps;

internal sealed record GetBookingStepsQuery(

    string providerId,
    string serviceId,
    string specialistId
    )
    : Query<GetBookingStepsResponse>
{
    public static GetBookingStepsQuery 
        Of(GetBookingStepsRequest request)
    {
        return new GetBookingStepsQuery(
            request.specialistId,
            request.providerId,
            request.serviceId
            )
        {
        };
    }
}
