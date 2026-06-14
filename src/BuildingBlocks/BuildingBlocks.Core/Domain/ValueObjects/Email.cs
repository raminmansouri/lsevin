using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects.Rules;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Email value object.
/// </summary>
public sealed class Email : ValueObject
{
    /// <summary>
    /// Gets the email value.
    /// </summary>
    public string Value { get; }

    /// <summary>
    /// Implicitly converts the email to a string.
    /// </summary>
    /// <param name="email">The email.</param>
    public static implicit operator string(Email email) => email.Value;

    /// <summary>
    /// Implicitly converts the string to an email.
    /// </summary>
    /// <param name="email">The email.</param>
    public static implicit operator Email(string email) => Create(email);

    /// <summary>
    /// Initializes a new instance of the <see cref="Email"/> class.
    /// </summary>
    private Email() => Value = string.Empty;

    /// <summary>
    /// Initializes a new instance of the <see cref="Email"/> class.
    /// </summary>
    /// <param name="value">The value.</param>
    [JsonConstructor]
    private Email(string value)
        : this() => Value = value;

    /// <summary>
    /// Initializes a new instance of the <see cref="Email"/> class.
    /// </summary>
    /// <param name="value">The value.</param>
    /// <returns>The <see cref="Email"/>.</returns>
    public static Email Create(string value)
    {
        Guard.Against.NullOrEmpty(value, nameof(value));
        Guard.Against.OutOfRange(
            value.Length,
            nameof(value),
            GlobalDomainConstValues.EmailMinLength,
            GlobalDomainConstValues.EmailMaxLength
        );

        CheckRule(new EmailMustBeValidRule(value));

        return new Email(value);
    }

    /// <summary>
    /// Deconstructs the email.
    /// </summary>
    /// <param name="value">The value.</param>
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
/// Represents the configuration for the <see cref="Email"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures the properties and constraints of the Email value object for the specified builder.
    /// </summary>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure(this ComplexPropertyBuilder<Email> builder)
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(Email).Underscore())
            .HasMaxLength(GlobalDomainConstValues.EmailMaxLength)
            .IsRequired();
    }

    /// <summary>
    /// Configures the properties and constraints of the Email value object for the specified builder.
    /// </summary>
    /// <typeparam name="T">The type of the parent entity that owns the Email value object .</typeparam>
    /// <param name="builder">The builder to apply the configuration to.</param>
    public static void Configure<T>(this OwnedNavigationBuilder<T, Email> builder)
        where T : class
    {
        builder
            .Property(b => b.Value)
            .HasColumnName(nameof(Email).Underscore())
            .HasMaxLength(GlobalDomainConstValues.EmailMaxLength)
            .IsRequired();
    }
}
