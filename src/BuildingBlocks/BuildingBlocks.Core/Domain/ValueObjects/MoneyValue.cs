using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Persistence;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents a monetary value with currency.
/// </summary>
public sealed class MoneyValue : ValueObject
{
    /// <summary>
    /// Gets the monetary value.
    /// </summary>
    public decimal Value { get; private set; }

    /// <summary>
    /// Gets the currency code.
    /// </summary>
    public string Currency { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="MoneyValue"/> class.
    /// </summary>
    private MoneyValue()
    {
        Currency = string.Empty;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="MoneyValue"/> class.
    /// </summary>
    /// <param name="value">The monetary value.</param>
    /// <param name="currency">The currency code.</param>
    [JsonConstructor]
    private MoneyValue(decimal value, string currency)
        : this()
    {
        Value = value;
        Currency = currency;
    }

    /// <summary>
    /// Represents the factory method for creating a money value.
    /// </summary>
    /// <param name="value">The monetary value.</param>
    /// <param name="currency">The currency code.</param>
    /// <returns>The <see cref="MoneyValue"/>.</returns>
    public static MoneyValue Of(decimal value, string currency)
    {
        Guard.Against.NegativeOrZero(value, nameof(value));
        Guard.Against.NullOrEmpty(currency, nameof(currency));

        return new MoneyValue(value, currency);
    }

    /// <summary>
    /// Represents the factory method for creating a zero money value.
    /// </summary>
    /// <param name="currency">The currency code.</param>
    /// <returns>The <see cref="MoneyValue"/>.</returns>
    public static MoneyValue Zero(string currency)
    {
        Guard.Against.NullOrEmpty(currency, nameof(currency));

        return new MoneyValue(0, currency);
    }

    /// <summary>
    /// Multiplies the money value by an integer.
    /// </summary>
    /// <param name="left">The multiplier.</param>
    /// <param name="right">The money values it to multiply.</param>
    /// <returns>The resulting money value.</returns>
    public static MoneyValue operator *(int left, MoneyValue right)
    {
        return new MoneyValue(right.Value * left, right.Currency);
    }

    /// <summary>
    /// Deconstructs the money value.
    /// </summary>
    /// <param name="value">The monetary value.</param>
    /// <param name="currency">The currency code.</param>
    public void Deconstruct(out decimal? value, out string currency)
    {
        value = Value;
        currency = Currency;
    }

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
        yield return Currency;
    }

    /// <inheritdoc />
    public override string ToString() => $"{Value} {Currency}";
}

/// <summary>
/// Represents the configuration for the <see cref="MoneyValue"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the MoneyValue value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<MoneyValue> builder)
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(MoneyValue.Value).Underscore())
            .HasColumnType(EfConstants.ColumnTypes.PriceDecimal)
            .IsRequired();

        builder
            .Property(b => b.Currency)
            .HasColumnName(nameof(MoneyValue.Currency).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the MoneyValue value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the MoneyValue value object.</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, MoneyValue> builder)
        where T : class
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(MoneyValue.Value).Underscore())
            .HasColumnType(EfConstants.ColumnTypes.PriceDecimal)
            .IsRequired();

        builder
            .Property(b => b.Currency)
            .HasColumnName(nameof(MoneyValue.Currency).Underscore())
            .HasMaxLength(EfConstants.Lenght.Tiny)
            .IsRequired();
    }
}
