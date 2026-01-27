using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Customer.Customer.ValueObjects;

public sealed record CustomerId(Guid Value) : TypedIdValueBase(Value)
{
    public static CustomerId Create(Guid value) => new(value);

    public static implicit operator Guid(CustomerId customerId) => customerId.Value;

    public static implicit operator CustomerId(Guid customerId) => Create(customerId);
}
