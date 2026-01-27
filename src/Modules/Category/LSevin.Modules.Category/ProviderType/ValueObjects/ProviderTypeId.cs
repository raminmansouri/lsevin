using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ProviderType.ValueObjects;

public sealed record ProviderTypeId(Guid Value) : TypedIdValueBase(Value)
{
    public static ProviderTypeId Create(Guid value) => new(value);

    public static implicit operator Guid(ProviderTypeId providerTypeId) => providerTypeId.Value;

    public static implicit operator ProviderTypeId(Guid providerTypeId) => Create(providerTypeId);
}
