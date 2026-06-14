using System.Collections.Frozen;
using System.Collections.ObjectModel;
using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects.Rules;
using BuildingBlocks.Core.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Core.Domain.ValueObjects;

/// <summary>
/// Represents a localized string with translations for multiple languages.
/// </summary>
public sealed class LocalizedString : ValueObject
{
    /// <summary>
    /// Gets the translations as a read-only dictionary.
    /// </summary>
    public IReadOnlyDictionary<string, string> Translations { get; private set; }

    /// <summary>
    /// Gets the default locale (first available translation).
    /// </summary>
    public string DefaultLocale => Translations.Keys.First();

    /// <summary>
    /// Gets the default translation value.
    /// </summary>
    public string DefaultValue => Translations.Values.First();

    /// <summary>
    /// Initializes a new instance of the <see cref="LocalizedString"/> class.
    /// </summary>
    private LocalizedString()
    {
        Translations = new ReadOnlyDictionary<string, string>(new Dictionary<string, string>(StringComparer.Ordinal));
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="LocalizedString"/> class.
    /// </summary>
    /// <param name="translations">The translations dictionary.</param>
    [JsonConstructor]
    private LocalizedString(IReadOnlyDictionary<string, string> translations)
        : this()
    {
        Translations = translations;
    }

    /// <summary>
    /// Creates a new localized string from a dictionary of translations.
    /// </summary>
    /// <param name="translations">The translations dictionary where key is locale and value is translation.</param>
    /// <returns>A new <see cref="LocalizedString"/> instance.</returns>
    public static LocalizedString Create(IDictionary<string, string> translations)
    {
        Guard.Against.NullOrEmpty(translations, nameof(translations));

        CheckRule(new LocalizedStringMustHaveTranslationsRule(translations));
        CheckRule(new LocalizedStringTranslationsMustNotBeEmptyRule(translations));

        var readOnlyTranslations = new ReadOnlyDictionary<string, string>(
            new Dictionary<string, string>(translations, StringComparer.OrdinalIgnoreCase)
        );

        return new LocalizedString(readOnlyTranslations);
    }

    /// <summary>
    /// Creates a new localized string with a single translation.
    /// </summary>
    /// <param name="locale">The locale code (e.g., "en-US", "fa-IR").</param>
    /// <param name="value">The translation value.</param>
    /// <returns>A new <see cref="LocalizedString"/> instance.</returns>
    public static LocalizedString Create(string locale, string value)
    {
        Guard.Against.NullOrEmpty(locale, nameof(locale));
        Guard.Against.NullOrEmpty(value, nameof(value));

        var translations = new Dictionary<string, string> { { locale, value } };
        return Create(translations);
    }

    /// <summary>
    /// Gets the translation for the specified locale.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <returns>The translation if found; otherwise, null.</returns>
    public string? GetTranslation(string locale)
    {
        Guard.Against.NullOrEmpty(locale, nameof(locale));

        return Translations.TryGetValue(locale, out var translation) ? translation : null;
    }

    /// <summary>
    /// Gets the translation for the specified locale or returns the default translation.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <returns>The translation if found; otherwise, the default translation.</returns>
    public string GetTranslationOrDefault(string locale)
    {
        return GetTranslation(locale) ?? DefaultValue;
    }

    /// <summary>
    /// Gets the translation for the specified locale or returns the fallback locale translation.
    /// </summary>
    /// <param name="locale">The preferred locale code.</param>
    /// <param name="fallbackLocale">The fallback locale code.</param>
    /// <returns>The translation if found; otherwise, the fallback translation or default.</returns>
    public string GetTranslationOrFallback(string locale, string fallbackLocale)
    {
        return GetTranslation(locale) ?? GetTranslation(fallbackLocale) ?? DefaultValue;
    }

    /// <summary>
    /// Determines whether the localized string has a translation for the specified locale.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <returns>True if a translation exists; otherwise, false.</returns>
    public bool HasTranslation(string locale)
    {
        Guard.Against.NullOrEmpty(locale, nameof(locale));

        return Translations.ContainsKey(locale);
    }

    /// <summary>
    /// Gets all available locales.
    /// </summary>
    /// <returns>A collection of available locale codes.</returns>
    public IEnumerable<string> GetAvailableLocales() => Translations.Keys;

    /// <summary>
    /// Updates or adds a translation for the specified locale.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <param name="value">The translation value.</param>
    /// <returns>A new <see cref="LocalizedString"/> with the updated translation.</returns>
    public LocalizedString WithTranslation(string locale, string value)
    {
        Guard.Against.NullOrEmpty(locale, nameof(locale));
        Guard.Against.NullOrEmpty(value, nameof(value));

        var updatedTranslations = new Dictionary<string, string>(Translations, StringComparer.OrdinalIgnoreCase)
        {
            [locale] = value,
        };

        return Create(updatedTranslations);
    }

    /// <summary>
    /// Removes a translation for the specified locale.
    /// </summary>
    /// <param name="locale">The locale code to remove.</param>
    /// <returns>A new <see cref="LocalizedString"/> without the specified locale.</returns>
    public LocalizedString WithoutTranslation(string locale)
    {
        Guard.Against.NullOrEmpty(locale, nameof(locale));

        if (!HasTranslation(locale))
        {
            return this;
        }

        var updatedTranslations = new Dictionary<string, string>(Translations, StringComparer.OrdinalIgnoreCase);
        updatedTranslations.Remove(locale);

        if (updatedTranslations.Count == 0)
        {
            throw new InvalidOperationException("Cannot remove the last translation from a LocalizedString.");
        }

        return Create(updatedTranslations);
    }

    /// <inheritdoc />
    protected override IEnumerable<object> GetEqualityComponents()
    {
        foreach (var kvp in Translations.OrderBy(x => x.Key))
        {
            yield return kvp.Key;
            yield return kvp.Value;
        }
    }

    /// <inheritdoc />
    public override string ToString() => DefaultValue;

    /// <summary>
    /// Implicitly converts a string to a LocalizedString with English locale.
    /// </summary>
    /// <param name="value">The string value.</param>
    public static implicit operator LocalizedString(string value)
    {
        return Create("en-US", value);
    }

    /// <summary>
    /// Implicitly converts a LocalizedString to its default value.
    /// </summary>
    /// <param name="localizedString">The LocalizedString.</param>
    public static implicit operator string(LocalizedString localizedString)
    {
        Guard.Against.Null(localizedString, nameof(localizedString));
        return localizedString.DefaultValue;
    }

    /// <summary>
    /// Deconstructs the LocalizedString into its translations.
    /// </summary>
    /// <param name="translations">The translations dictionary.</param>
    public void Deconstruct(out IReadOnlyDictionary<string, string> translations)
    {
        translations = Translations;
    }
}

/// <summary>
/// Represents the configuration extensions for the <see cref="LocalizedString"/> value object.
/// </summary>
public static partial class EntityConfiguration
{
    /// <summary>
    /// Configures a LocalizedString property to be stored as JSON in the database.
    /// </summary>
    /// <typeparam name="TEntity">The entity type.</typeparam>
    /// <param name="propertyBuilder">The property builder.</param>
    /// <param name="columnName">The database column name.</param>
    /// <param name="maxLength">The maximum length for the JSON column.</param>
    /// <param name="isRequired">Whether the property is required.</param>
    /// <returns>The property builder for chaining.</returns>
    public static PropertyBuilder<LocalizedString?> ConfigureLocalizedString<TEntity>(
        this PropertyBuilder<LocalizedString?> propertyBuilder,
        string columnName,
        int maxLength = 4000,
        bool isRequired = true
    )
        where TEntity : class
    {
        propertyBuilder
            .HasColumnName(columnName)
            .HasColumnType("jsonb")
            // .HasMaxLength(maxLength)
            .HasConversion<LocalizedStringJsonConverter>()
            .IsRequired(isRequired);

        return propertyBuilder;
    }

    /// <summary>
    /// Configures a LocalizedString property to be stored as JSON in the database with a specified column type.
    /// </summary>
    /// <typeparam name="TEntity">The entity type.</typeparam>
    /// <param name="propertyBuilder">The property builder.</param>
    /// <param name="columnName">The database column name.</param>
    /// <param name="columnType">The database column type (e.g., "jsonb" for PostgreSQL).</param>
    /// <param name="maxLength">The maximum length for the JSON column.</param>
    /// <param name="isRequired">Whether the property is required.</param>
    /// <returns>The property builder for chaining.</returns>
    public static PropertyBuilder<LocalizedString?> ConfigureLocalizedStringWithType<TEntity>(
        this PropertyBuilder<LocalizedString?> propertyBuilder,
        string columnName,
        string columnType,
        int maxLength = 4000,
        bool isRequired = true
    )
        where TEntity : class
    {
        propertyBuilder
            .HasColumnName(columnName)
            .HasColumnType(columnType)
            // .HasMaxLength(maxLength)
            .HasConversion<LocalizedStringJsonConverter>()
            .IsRequired(isRequired);

        return propertyBuilder;
    }

    /// <summary>
    /// Configures a non-nullable LocalizedString property.
    /// </summary>
    /// <typeparam name="TEntity">The entity type.</typeparam>
    /// <param name="propertyBuilder">The property builder.</param>
    /// <param name="columnName">The database column name.</param>
    /// <param name="maxLength">The maximum length for the JSON column.</param>
    /// <param name="isRequired">Whether the property is required.</param>
    /// <returns>The property builder for chaining.</returns>
    public static PropertyBuilder<LocalizedString> ConfigureLocalizedStringNonNullable<TEntity>(
        this PropertyBuilder<LocalizedString> propertyBuilder,
        string columnName,
        int maxLength = 4000,
        bool isRequired = true
    )
        where TEntity : class
    {
        propertyBuilder
            .HasColumnName(columnName)
            .HasColumnType("jsonb")
            // .HasMaxLength(maxLength)
            .HasConversion<LocalizedStringNonNullableJsonConverter>()
            .IsRequired(isRequired);

        return propertyBuilder;
    }
}
