using BuildingBlocks.Core.Dtos.Localization;

namespace BuildingBlocks.Core.Models;

/// <summary>
/// Represents the address DTO.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="AddressDto"/> class.
/// </remarks>
/// <param name="Country">The country.</param>
/// <param name="City">The city.</param>
/// <param name="Street">The street.</param>
/// <param name="Detail">The detail.</param>
/// <param name="ZipCode">The zip code.</param>
/// <param name="Coordinates">The geographic coordinates.</param>
public sealed record AddressDto(
    string Country,
    string City,
    LocalizedContentDto? Street,
    LocalizedContentDto? Detail,
    string? ZipCode,
    CoordinatesDto? Coordinates
)
{
    private AddressDto()
        : this(Country: string.Empty, City: string.Empty, Street: null, Detail: null, ZipCode: null, Coordinates: null)
    { }
}
