using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record ProviderStaffId(Guid Value) : TypedIdValueBase(Value)
{
    public static ProviderStaffId Create(Guid value) => new(value);

    public static implicit operator Guid(ProviderStaffId providerStaffId) => providerStaffId.Value;

    public static implicit operator ProviderStaffId(Guid providerStaffId) => Create(providerStaffId);
}
