using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Location.Enumerations;

public sealed class LocationType : Enumeration
{
    public static readonly LocationType Country = new(1, nameof(Country));
    public static readonly LocationType City = new(2, nameof(City));

    /// <summary>
    /// Sits between <see cref="Country"/> and <see cref="City"/>. Optional: countries
    /// without subdivisions parent their cities directly to the country, so consumers
    /// must treat a city's country as "nearest ancestor of type Country", not "parent".
    /// </summary>
    public static readonly LocationType Province = new(3, nameof(Province));

    private LocationType(int id, string name)
        : base(id, name) { }
}
