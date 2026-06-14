using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderGallery;

internal sealed record GetServiceProviderGalleryQuery(Guid ServiceProviderId)
    : Query<IReadOnlyCollection<GetServiceProviderGalleryResponse>>
{
    public static GetServiceProviderGalleryQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
