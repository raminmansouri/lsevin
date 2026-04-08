using BuildingBlocks.Core.Messaging.Queries;
using LSevin.Modules.Category.ServiceProvider.Features.GetProviderById.ProviderModels;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderById;

internal sealed record GetProviderByIdQuery(Guid ServiceProviderId) : Query<ProviderResponse>
{
    public static GetProviderByIdQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
