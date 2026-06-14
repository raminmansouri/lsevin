using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServicePageById;

internal sealed record GetServicePageByIdQuery(Guid serviceId)
    : Query<GetServicePageByIdResponse>
{
    public static GetServicePageByIdQuery Of(Guid serviceId)
    {
        var d = new GetServicePageByIdQuery(serviceId);
        return d;
    }
}
