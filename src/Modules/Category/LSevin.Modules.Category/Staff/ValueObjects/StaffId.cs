using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Staff.ValueObjects;

public sealed record StaffId(Guid Value) : TypedIdValueBase(Value)
{
    public static StaffId Create(Guid value) => new(value);

    public static implicit operator Guid(StaffId staffId) => staffId.Value;

    public static implicit operator StaffId(Guid staffId) => Create(staffId);
}
