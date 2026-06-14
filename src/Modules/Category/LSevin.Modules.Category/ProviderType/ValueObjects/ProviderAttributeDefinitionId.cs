using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ProviderType.ValueObjects;

public sealed record ProviderAttributeDefinitionId(Guid Value) : TypedIdValueBase(Value)
{
    public static ProviderAttributeDefinitionId Create(Guid value) => new(value);

    public static implicit operator Guid(ProviderAttributeDefinitionId providerAttributeDefinitionId) =>
        providerAttributeDefinitionId.Value;

    public static implicit operator ProviderAttributeDefinitionId(Guid providerAttributeDefinitionId) =>
        Create(providerAttributeDefinitionId);
}
