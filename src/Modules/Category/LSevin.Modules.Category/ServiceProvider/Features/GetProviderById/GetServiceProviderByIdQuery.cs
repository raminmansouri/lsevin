using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderById;

internal sealed record GetServiceProviderByIdQuery(Guid ServiceProviderId) : Query<GetServiceProviderByIdResponse>
{
    public static GetServiceProviderByIdQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
