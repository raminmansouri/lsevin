using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record ServiceProviderId(Guid Value) : TypedIdValueBase(Value)
{
    public static ServiceProviderId Create(Guid value) => new(value);

    public static implicit operator Guid(ServiceProviderId serviceProviderId) => serviceProviderId.Value;

    public static implicit operator ServiceProviderId(Guid serviceProviderId) => Create(serviceProviderId);
}
