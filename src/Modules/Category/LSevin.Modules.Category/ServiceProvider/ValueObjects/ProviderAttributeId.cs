using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record ProviderAttributeId(Guid Value) : TypedIdValueBase(Value)
{
    public static ProviderAttributeId Create(Guid value) => new(value);

    public static implicit operator Guid(ProviderAttributeId providerAttributeId) => providerAttributeId.Value;

    public static implicit operator ProviderAttributeId(Guid providerAttributeId) => Create(providerAttributeId);
}
