using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeAttributes;

internal sealed record GetProviderTypeAttributesQuery(Guid ProviderTypeId) : IQuery<GetProviderTypeAttributesResponse>
{
    public static GetProviderTypeAttributesQuery Of(Guid providerTypeId) => new(providerTypeId);
}
