using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.Primitives;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents the last name of a contact.
/// </summary>
public sealed class LastName : ValueObject
{
    /// <summary>
    /// Gets the last name value.
    /// </summary>
    public string Value { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="LastName"/> class.
    /// </summary>
    private LastName() => Value = string.Empty;

    /// <summary>
    /// Initializes a new instance of the <see cref="LastName"/> class.
    /// </summary>
    /// <param name="value">The last name.</param>
    [JsonConstructor]
    private LastName(string value)
        : this() => Value = value;

    /// <summary>
    /// Implicitly converts the last name to a string.
    /// </summary>
    /// <param name="lastName">The last name.</param>
    public static implicit operator string(LastName lastName) => lastName.Value;

    /// <summary>
    /// Implicitly converts the string to a last name.
    /// </summary>
    /// <param name="lastName">The last name.</param>
    public static implicit operator LastName(string lastName) => Create(lastName);

    /// <summary>
    /// Initializes a new instance of the <see cref="LastName"/> class.
    /// </summary>
    /// <param name="value">The last name.</param>
    /// <returns>The <see cref="LastName"/>.</returns>
    public static LastName Create(string value)
    {
        Guard.Against.NullOrEmpty(value, nameof(LastName));

        Guard.Against.OutOfRange(value.Length, nameof(LastName), 1, GlobalDomainConstValues.LastNameMaxLength);

        return new LastName(value);
    }

    /// <summary>
    /// Deconstructs the last name.
    /// </summary>
    /// <param name="value">The last name.</param>
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
/// Represents the configuration for the <see cref="LastName"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the LastName value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<LastName> builder)
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(LastName).Underscore())
            .HasMaxLength(GlobalDomainConstValues.LastNameMaxLength)
            .IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the LastName value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the LastName value object .</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, LastName> builder)
        where T : class
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(LastName).Underscore())
            .HasMaxLength(GlobalDomainConstValues.LastNameMaxLength)
            .IsRequired();
    }
}
