using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Persistence;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents an address value object.
/// </summary>
public sealed class Address : ValueObject
{
    /// <summary>
    /// Gets the country.
    /// </summary>
    public string Country { get; private set; }

    /// <summary>
    /// Gets the city.
    /// </summary>
    public string City { get; private set; }

    /// <summary>
    /// Gets the street.
    /// </summary>
    public LocalizedString? Street { get; private set; }

    /// <summary>
    /// Gets the detail.
    /// </summary>
    public LocalizedString? Detail { get; private set; }

    /// <summary>
    /// Gets the zip code.
    /// </summary>
    public string? ZipCode { get; private set; }

    /// <summary>
    /// Gets the geographic coordinates (optional).
    /// </summary>
    public Coordinates? Coordinates { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="Address"/> class.
    /// </summary>
    private Address()
    {
        Country = string.Empty;
        City = string.Empty;
        Street = null;
        ZipCode = null;
        Detail = null;
        Coordinates = null;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Address"/> class.
    /// </summary>
    /// <param name="country">The country.</param>
    /// <param name="city">The city.</param>
    /// <param name="street">The street.</param>
    /// <param name="zipcode">The zip code.</param>
    /// <param name="detail">The detail.</param>
    /// <param name="coordinates">The geographic coordinates.</param>
    [JsonConstructor]
    private Address(
        string country,
        string city,
        LocalizedString? street,
        string? zipcode,
        LocalizedString? detail,
        Coordinates? coordinates
    )
        : this()
    {
        Country = country;
        City = city;
        Street = street;
        ZipCode = zipcode;
        Detail = detail;
        Coordinates = coordinates;
    }

    /// <summary>
    /// Represents the factory method for creating an address.
    /// </summary>
    /// <param name="country">The country.</param>
    /// <param name="city">The city.</param>
    /// <param name="street">The street.</param>
    /// <param name="zipcode">The zip code.</param>
    /// <param name="detail">The detail.</param>
    /// <param name="coordinates">The geographic coordinates.</param>
    /// <returns>The <see cref="Address"/>.</returns>
    public static Address Of(
        string country,
        string city,
        LocalizedString? street,
        string? zipcode,
        LocalizedString? detail,
        Coordinates? coordinates = null
    )
    {
        Guard.Against.NullOrEmpty(country, nameof(country));
        Guard.Against.NullOrEmpty(city, nameof(city));

        return new Address(country, city, street, zipcode, detail, coordinates);
    }

    /// <summary>
    /// Deconstructs the address.
    /// </summary>
    /// <param name="country">The country.</param>
    /// <param name="city">The city.</param>
    /// <param name="street">The street.</param>
    /// <param name="zipcode">The zip code.</param>
    /// <param name="detail">The detail.</param>
    /// <param name="coordinates">The geographic coordinates.</param>
    public void Deconstruct(
        out string country,
        out string city,
        out LocalizedString? street,
        out string? zipcode,
        out LocalizedString? detail,
        out Coordinates? coordinates
    )
    {
        country = Country;
        city = City;
        street = Street;
        zipcode = ZipCode;
        detail = Detail;
        coordinates = Coordinates;
    }

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        // Using a yield return statement to return each element one at a time
        yield return Country;
        yield return City;
        yield return Street?.DefaultValue ?? string.Empty;
        yield return ZipCode ?? string.Empty;
        yield return Detail?.DefaultValue ?? string.Empty;
        yield return Coordinates?.ToString() ?? string.Empty;
    }

    /// <inheritdoc />
    public override string ToString() =>
        $"{Country}, {City}, {Street?.DefaultValue ?? string.Empty}, {ZipCode}, {Detail?.DefaultValue ?? string.Empty}"
        + (Coordinates != null ? $" {Coordinates}" : string.Empty);
}

/// <summary>
/// Represents the configuration for the <see cref="Address"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the Address value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the Address value object .</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, Address> builder)
        where T : class
    {
        builder
            .Property(b => b.Country)
            .HasColumnName(nameof(Address.Country).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();

        builder
            .Property(b => b.City)
            .HasColumnName(nameof(Address.City).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();

        builder
            .Property(b => b.Street)
            .ConfigureLocalizedString<T>(
                nameof(Address.Street).Underscore() + EfConstants.LocalizedTablePostfix,
                // maxLength: EfConstants.Lenght.Medium * 10,
                isRequired: false
            );

        builder
            .Property(b => b.Detail)
            .ConfigureLocalizedString<T>(
                nameof(Address.Detail).Underscore() + EfConstants.LocalizedTablePostfix,
                // maxLength: EfConstants.Lenght.ExtraLong * 10,
                isRequired: false
            );

        builder
            .Property(b => b.ZipCode)
            .HasColumnName(nameof(Address.ZipCode).Underscore())
            .HasMaxLength(EfConstants.Lenght.Normal)
            .IsRequired(false);

        builder.OwnsOne(b => b.Coordinates).Configure();
    }
}
