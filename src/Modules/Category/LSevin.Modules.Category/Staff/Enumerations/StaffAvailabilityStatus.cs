using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Staff.Enumerations;

public sealed class StaffAvailabilityStatus : Enumeration
{
    public static readonly StaffAvailabilityStatus Available = new(1, nameof(Available));
    public static readonly StaffAvailabilityStatus Busy = new(2, nameof(Busy));
    public static readonly StaffAvailabilityStatus OnLeave = new(3, nameof(OnLeave));
    public static readonly StaffAvailabilityStatus Inactive = new(4, nameof(Inactive));

    private StaffAvailabilityStatus(int id, string name)
        : base(id, name) { }
}
