using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record BookingId(Guid Value) : TypedIdValueBase(Value)
{
    public static BookingId Create(Guid value) => new(value);

    public static implicit operator Guid(BookingId bookingId) => bookingId.Value;

    public static implicit operator BookingId(Guid bookingId) => Create(bookingId);
}
