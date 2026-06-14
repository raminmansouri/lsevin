namespace BuildingBlocks.Core.Models;

/// <summary>
/// Data Transfer Object for geographic coordinates.
/// </summary>
public record CoordinatesDto
{
    /// <summary>
    /// Gets or initializes the longitude coordinate (X-axis). Valid range: -180 to 180 degrees.
    /// </summary>
    public required double Longitude { get; init; }

    /// <summary>
    /// Gets or initializes the latitude coordinate (Y-axis). Valid range: -90 to 90 degrees.
    /// </summary>
    public required double Latitude { get; init; }
}
