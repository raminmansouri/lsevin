using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record ServiceAttributeValueId(Guid Value) : TypedIdValueBase(Value)
{
    public static ServiceAttributeValueId Create(Guid value) => new(value);

    public static implicit operator Guid(ServiceAttributeValueId serviceAttributeValueId) =>
        serviceAttributeValueId.Value;

    public static implicit operator ServiceAttributeValueId(Guid serviceAttributeValueId) =>
        Create(serviceAttributeValueId);
}
