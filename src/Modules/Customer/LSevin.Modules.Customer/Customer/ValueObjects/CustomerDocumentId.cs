using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Customer.Customer.ValueObjects;

public sealed record CustomerDocumentId(Guid Value) : TypedIdValueBase(Value)
{
    public static CustomerDocumentId Create(Guid value) => new(value);

    public static implicit operator Guid(CustomerDocumentId customerId) => customerId.Value;

    public static implicit operator CustomerDocumentId(Guid customerId) => Create(customerId);
}
