using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Customer.Consulting.ValueObjects;

public sealed record ConsultingId(Guid Value) : TypedIdValueBase(Value)
{
    public static ConsultingId Create(Guid value) => new(value);

    public static implicit operator Guid(ConsultingId consultingId) => consultingId.Value;

    public static implicit operator ConsultingId(Guid consultingId) => Create(consultingId);
}
