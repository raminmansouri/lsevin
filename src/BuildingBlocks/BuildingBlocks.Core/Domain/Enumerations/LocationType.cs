using System.Text.Json.Serialization;
using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Enumerations;

/// <summary>
/// Represents the types of location types.
/// </summary>
public sealed class LocationType : Enumeration
{
    #region Seed

    /// <summary>
    /// Represents a Country location type.
    /// </summary>
    public static readonly LocationType Country = new(1, nameof(Country));

    /// <summary>
    /// Represents a City location type.
    /// </summary>
    public static readonly LocationType City = new(2, nameof(City));

    #endregion

    #region Constructor

    /// <summary>
    /// Initializes a new instance of the <see cref="LocationType"/> class.
    /// </summary>
    /// <param name="id">The unique identifier for the location type.</param>
    /// <param name="name">The name of the location type.</param>
    [JsonConstructor]
    private LocationType(int id, string name)
        : base(id, name) { }

    #endregion
}
