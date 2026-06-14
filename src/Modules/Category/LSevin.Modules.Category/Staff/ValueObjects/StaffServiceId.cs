using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Staff.ValueObjects;

public sealed record StaffServiceId(Guid Value) : TypedIdValueBase(Value)
{
    public static StaffServiceId Create(Guid value) => new(value);

    public static implicit operator Guid(StaffServiceId staffServiceId) => staffServiceId.Value;

    public static implicit operator StaffServiceId(Guid staffServiceId) => Create(staffServiceId);
}
