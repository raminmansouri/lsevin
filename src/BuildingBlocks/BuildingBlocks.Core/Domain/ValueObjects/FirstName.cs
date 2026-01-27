using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.Primitives;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents a first name value object.
/// </summary>
public sealed class FirstName : ValueObject
{
    /// <summary>
    /// Gets the first name value.
    /// </summary>
    public string Value { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="FirstName"/> class.
    /// </summary>
    private FirstName() => Value = string.Empty;

    /// <summary>
    /// Initializes a new instance of the <see cref="FirstName"/> class.
    /// </summary>
    /// <param name="value">The first name.</param>
    [JsonConstructor]
    private FirstName(string value)
        : this() => Value = value;

    /// <summary>
    /// Implicitly converts the string to a first name.
    /// </summary>
    /// <param name="firstName">The first name.</param>
    public static implicit operator string(FirstName firstName) => firstName.Value;

    /// <summary>
    /// Implicitly converts the string to a first name.
    /// </summary>
    /// <param name="firstName">The first name.</param>
    public static implicit operator FirstName(string firstName) => Create(firstName);

    /// <summary>
    /// Implicitly converts the string to a first name.
    /// </summary>
    /// <param name="value">The first name.</param>
    /// <returns>The <see cref="FirstName"/>.</returns>
    public static FirstName Create(string value)
    {
        Guard.Against.NullOrEmpty(value, nameof(value));
        Guard.Against.OutOfRange(value.Length, nameof(value), 1, GlobalDomainConstValues.FirstNameMaxLength);

        return new FirstName(value);
    }

    /// <summary>
    /// Deconstructs the first name.
    /// </summary>
    /// <param name="value">The first name.</param>
    public void Deconstruct(out string value) => value = Value;

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    /// <inheritdoc />
    public override string ToString() => Value;
}

/// <summary>
/// Represents the configuration for the <see cref="FirstName"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the FirstName value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<FirstName> builder)
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(FirstName).Underscore())
            .HasMaxLength(GlobalDomainConstValues.FirstNameMaxLength)
            .IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the FirstName value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the FirstName value object .</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, FirstName> builder)
        where T : class
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(FirstName).Underscore())
            .HasMaxLength(GlobalDomainConstValues.FirstNameMaxLength)
            .IsRequired();
    }
}
