using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Location.Enumerations;

public sealed class LocationType : Enumeration
{
    public static readonly LocationType Country = new(1, nameof(Country));
    public static readonly LocationType City = new(2, nameof(City));

    private LocationType(int id, string name)
        : base(id, name) { }
}
