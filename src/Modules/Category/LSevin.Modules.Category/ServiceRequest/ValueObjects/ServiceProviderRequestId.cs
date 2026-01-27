using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceRequest.ValueObjects;

public sealed record ServiceProviderRequestId(Guid Value) : TypedIdValueBase(Value)
{
    public static ServiceProviderRequestId Create(Guid value) => new(value);

    public static implicit operator Guid(ServiceProviderRequestId id) => id.Value;

    public static implicit operator ServiceProviderRequestId(Guid id) => Create(id);
}
