using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record ProviderPolicyId(Guid Value) : TypedIdValueBase(Value)
{
    public static ProviderPolicyId Create(Guid value) => new(value);

    public static implicit operator Guid(ProviderPolicyId providerPolicyId) => providerPolicyId.Value;

    public static implicit operator ProviderPolicyId(Guid providerPolicyId) => Create(providerPolicyId);
}
