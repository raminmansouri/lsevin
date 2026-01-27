using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents geographic coordinates (longitude, latitude) as an immutable value object.
/// Follows WGS84 coordinate system standard.
/// </summary>
public sealed class Coordinates : ValueObject
{
    /// <summary>
    /// Gets the longitude coordinate (X-axis). Valid range: -180 to 180 degrees.
    /// </summary>
    public double Longitude { get; private set; }

    /// <summary>
    /// Gets the latitude coordinate (Y-axis). Valid range: -90 to 90 degrees.
    /// </summary>
    public double Latitude { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="Coordinates"/> class.
    /// </summary>
    private Coordinates() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="Coordinates"/> class.
    /// </summary>
    /// <param name="longitude">The longitude.</param>
    /// <param name="latitude">The latitude.</param>
    private Coordinates(double longitude, double latitude)
    {
        Longitude = longitude;
        Latitude = latitude;
    }

    /// <summary>
    /// Factory method to create valid Coordinates instance.
    /// </summary>
    /// <param name="longitude">Longitude value between -180 and 180.</param>
    /// <param name="latitude">Latitude value between -90 and 90.</param>
    /// <returns>Validated Coordinates instance.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when coordinates are out of valid range.</exception>
    public static Coordinates Of(double longitude, double latitude)
    {
        Guard.Against.OutOfRange(
            longitude,
            nameof(longitude),
            -180.0,
            180.0,
            "Longitude must be between -180 and 180 degrees."
        );
        Guard.Against.OutOfRange(
            latitude,
            nameof(latitude),
            -90.0,
            90.0,
            "Latitude must be between -90 and 90 degrees."
        );

        return new Coordinates(longitude, latitude);
    }

    /// <summary>
    /// Returns the properties used for equality comparison.
    /// </summary>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Longitude;
        yield return Latitude;
    }

    /// <summary>
    /// String representation in standard format: "lat, lon".
    /// </summary>
    public override string ToString() => $"{Latitude:F6}, {Longitude:F6}";
}

/// <summary>
/// Represents the configuration for the <see cref="Coordinates"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the Coordinates value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the Coordinates value object.</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, Coordinates> builder)
        where T : class
    {
        builder
            .Property(c => c.Longitude)
            .HasColumnName(nameof(Coordinates.Longitude).Underscore())
            .HasColumnType("decimal(10, 7)")
            .IsRequired();

        builder
            .Property(c => c.Latitude)
            .HasColumnName(nameof(Coordinates.Latitude).Underscore())
            .HasColumnType("decimal(10, 7)")
            .IsRequired();
    }
}
