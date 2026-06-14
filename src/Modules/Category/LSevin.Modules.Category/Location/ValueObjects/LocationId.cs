using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Location.ValueObjects;

public sealed record LocationId(Guid Value) : TypedIdValueBase(Value)
{
    public static LocationId Create(Guid value) => new(value);

    public static implicit operator Guid(LocationId locationId) => locationId.Value;

    public static implicit operator LocationId(Guid locationId) => Create(locationId);
}
