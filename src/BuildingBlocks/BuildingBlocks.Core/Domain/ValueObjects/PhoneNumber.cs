using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects.Rules;
using BuildingBlocks.Core.Persistence;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PhoneNumbers;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents a phone number value object.
/// </summary>
public sealed class PhoneNumber : ValueObject
{
    /// <summary>
    /// Gets the phone number value.
    /// </summary>
    public string Value { get; }

    /// <summary>
    /// Gets the country code.
    /// </summary>
    public string CountryCode { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="PhoneNumber"/> class.
    /// </summary>
    private PhoneNumber()
    {
        Value = string.Empty;
        CountryCode = string.Empty;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="PhoneNumber"/> class.
    /// </summary>
    /// <param name="value">The phone number.</param>
    /// <param name="countryCode">The country code.</param>
    [JsonConstructor]
    private PhoneNumber(string value, string countryCode)
        : this()
    {
        Value = value;
        CountryCode = countryCode;
    }

    /// <summary>
    /// Implicitly converts the phone number to a string.
    /// </summary>
    /// <param name="phoneNumber">The phone number.</param>
    public static implicit operator string(PhoneNumber phoneNumber) => phoneNumber.Value;

    /// <summary>
    /// Creates a new instance of the <see cref="PhoneNumber"/> class.
    /// </summary>
    /// <param name="value">The phone number.</param>
    /// <param name="countryCode">The country code (e.g., "US", "GB", "IR").</param>
    /// <returns>The <see cref="PhoneNumber"/>.</returns>
    public static PhoneNumber Create(string value, string countryCode)
    {
        Guard.Against.Empty(value, nameof(PhoneNumber));
        Guard.Against.Empty(countryCode, nameof(countryCode));

        CheckRule(new PhoneNumberMustBeValidRule(value, countryCode));

        return new PhoneNumber(value, countryCode);
    }

    /// <summary>
    /// Deconstructs the phone number.
    /// </summary>
    /// <param name="value">The phone number.</param>
    /// <param name="countryCode">The country code.</param>
    public void Deconstruct(out string value, out string countryCode)
    {
        value = Value;
        countryCode = CountryCode;
    }

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
        yield return CountryCode;
    }

    /// <inheritdoc />
    public override string ToString() => $"{CountryCode}{Value}";
}

/// <summary>
/// Provides extension methods for the <see cref="PhoneNumber"/> class.
/// </summary>
public static class PhoneNumberExtensions
{
    private static readonly PhoneNumberUtil _phoneNumberUtil = PhoneNumberUtil.GetInstance();

    /// <summary>
    /// Checks if the phone number is valid.
    /// </summary>
    /// <param name="phoneNumberUtil">The phone number util.</param>
    /// <param name="phoneNumber">The phone number.</param>
    /// <param name="countryCode">The country code.</param>
    /// <returns>True if the phone number is valid; otherwise, false.</returns>
    public static bool IsValidPhoneNumber(this PhoneNumberUtil phoneNumberUtil, string phoneNumber, string countryCode)
    {
        try
        {
            var parsedPhoneNumber = phoneNumberUtil.Parse(phoneNumber, countryCode);
            return phoneNumberUtil.IsValidNumber(parsedPhoneNumber);
        }
        catch (NumberParseException)
        {
            return false;
        }
    }

    /// <summary>
    /// Formats the phone number to E.164 format (e.g., +989123456789 or +12345678901).
    /// </summary>
    /// <param name="phoneNumber">The phone number value object.</param>
    /// <returns>The phone number formatted in E.164 format.</returns>
    public static string ToE164Format(this PhoneNumber phoneNumber)
    {
        var parsedNumber = _phoneNumberUtil.Parse(phoneNumber.Value, phoneNumber.CountryCode);
        return _phoneNumberUtil.Format(parsedNumber, PhoneNumberFormat.E164);
    }

    /// <summary>
    /// Parses an E.164 formatted phone number (e.g., +989123456789) into a PhoneNumber value object.
    /// </summary>
    /// <param name="e164PhoneNumber">The phone number in E.164 format.</param>
    /// <returns>The PhoneNumber value object with separated value and country code.</returns>
    public static PhoneNumber ParseFromE164(string e164PhoneNumber)
    {
        var parsedNumber = _phoneNumberUtil.Parse(e164PhoneNumber, null);
        var countryCode = _phoneNumberUtil.GetRegionCodeForNumber(parsedNumber) ?? string.Empty;
        var nationalNumber = parsedNumber.NationalNumber.ToString();

        return PhoneNumber.Create(nationalNumber, countryCode);
    }
}

/// <summary>
/// Represents the configuration for the <see cref="PhoneNumber"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the PhoneNumber value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<PhoneNumber> builder)
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(PhoneNumber).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();

        builder
            .Property(b => b.CountryCode)
            .HasColumnName($"{nameof(PhoneNumber)}{nameof(PhoneNumber.CountryCode)}".Underscore())
            .HasMaxLength(GlobalDomainConstValues.PhoneCountryCodeMaxLength)
            .IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the PhoneNumber value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the PhoneNumber value object .</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, PhoneNumber> builder)
        where T : class
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(PhoneNumber).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();

        builder
            .Property(b => b.CountryCode)
            .HasColumnName($"{nameof(PhoneNumber)}{nameof(PhoneNumber.CountryCode)}".Underscore())
            .HasMaxLength(GlobalDomainConstValues.PhoneCountryCodeMaxLength)
            .IsRequired();
    }
}
