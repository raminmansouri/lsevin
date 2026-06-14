using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Staff.ValueObjects;

public sealed record StaffAvailabilityId(Guid Value) : TypedIdValueBase(Value)
{
    public static StaffAvailabilityId Create(Guid value) => new(value);

    public static implicit operator Guid(StaffAvailabilityId staffAvailabilityId) => staffAvailabilityId.Value;

    public static implicit operator StaffAvailabilityId(Guid staffAvailabilityId) => Create(staffAvailabilityId);
}
