using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceById;

internal sealed record GetServiceByIdQuery(Guid ServiceProviderId) : Query<GetServiceByIdResponse>
{
    public static GetServiceByIdQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
