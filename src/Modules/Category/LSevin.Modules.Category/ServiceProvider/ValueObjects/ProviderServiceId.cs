using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record ProviderServiceId(Guid Value) : TypedIdValueBase(Value)
{
    public static ProviderServiceId Create(Guid value) => new(value);

    public static implicit operator Guid(ProviderServiceId providerServiceId) => providerServiceId.Value;

    public static implicit operator ProviderServiceId(Guid providerServiceId) => Create(providerServiceId);
}
