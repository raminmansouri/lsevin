using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderPolicies;

internal sealed record GetServiceProviderPoliciesQuery(Guid ServiceProviderId)
    : Query<IReadOnlyCollection<GetServiceProviderPoliciesResponse>>
{
    public static GetServiceProviderPoliciesQuery Of(Guid serviceProviderId) => new(serviceProviderId);
}
