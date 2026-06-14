using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects.Rules;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents a date of birth value object.
/// </summary>
public sealed class BirthDate : ValueObject
{
    /// <summary>
    /// Gets the date of birth value.
    /// </summary>
    public DateTime Value { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="BirthDate"/> class.
    /// </summary>
    private BirthDate() => Value = default;

    /// <summary>
    /// Initializes a new instance of the <see cref="BirthDate"/> class.
    /// </summary>
    /// <param name="value">The date of birth.</param>
    [JsonConstructor]
    private BirthDate(DateTime value)
        : this() => Value = value;

    /// <summary>
    /// Implicitly converts the date time to a date of birth.
    /// </summary>
    /// <param name="dateOfBirth">The date of birth.</param>
    public static implicit operator DateTime(BirthDate dateOfBirth) => dateOfBirth.Value;

    /// <summary>
    /// Implicitly converts the date time to a date of birth.
    /// </summary>
    /// <param name="dateOfBirth">The date of birth.</param>
    public static implicit operator BirthDate(DateTime dateOfBirth) => Create(dateOfBirth);

    /// <summary>
    /// Implicitly converts the date time to a date of birth.
    /// </summary>
    /// <param name="value">The date of birth.</param>
    /// <returns>The <see cref="BirthDate"/>.</returns>
    public static BirthDate Create(DateTime value)
    {
        Guard.Against.Null(value, nameof(value));

        CheckRule(new BirthDateMustBeValidRule(value));

        return new BirthDate(value);
    }

    /// <summary>
    /// Deconstructs the date of birth.
    /// </summary>
    /// <param name="value">The date of birth.</param>
    public void Deconstruct(out DateTime value) => value = Value;

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    /// <inheritdoc />
    public override string ToString() => Value.ToString("yyyy-MM-dd");
}

/// <summary>
/// Represents the configuration for the <see cref="BirthDate"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the BirthDate value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<BirthDate> builder)
    {
        builder.Property(b => b.Value).HasColumnName(nameof(BirthDate).Underscore()).IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the BirthDate value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the BirthDate value object .</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, BirthDate> builder)
        where T : class
    {
        builder.Property(b => b.Value).HasColumnName(nameof(BirthDate).Underscore()).IsRequired();
    }
}
