using System.ComponentModel.DataAnnotations;

namespace BuildingBlocks.Core.Dtos.Localization;

/// <summary>
/// Data transfer object for localized content with multiple translations.
/// </summary>
/// <param name="Translations">The translations dictionary where key is locale and value is translation.</param>
public sealed record LocalizedContentDto([property: Required] Dictionary<string, string> Translations)
{
    /// <summary>
    /// Creates a localized content DTO with a single translation.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <param name="value">The translation value.</param>
    /// <returns>A new <see cref="LocalizedContentDto"/>.</returns>
    public static LocalizedContentDto Create(string locale, string value)
    {
        return new LocalizedContentDto(new Dictionary<string, string>(StringComparer.Ordinal) { { locale, value } });
    }

    /// <summary>
    /// Creates a localized content DTO from multiple translations.
    /// </summary>
    /// <param name="translations">The translations dictionary.</param>
    /// <returns>A new <see cref="LocalizedContentDto"/>.</returns>
    public static LocalizedContentDto Create(Dictionary<string, string> translations)
    {
        return new LocalizedContentDto(translations ?? []);
    }

    /// <summary>
    /// Gets the translation for the specified locale.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <returns>The translation if found; otherwise, null.</returns>
    public string? GetTranslation(string locale)
    {
        return Translations.TryGetValue(locale, out var translation) ? translation : null;
    }

    /// <summary>
    /// Determines whether a translation exists for the specified locale.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <returns>True if a translation exists; otherwise, false.</returns>
    public bool HasTranslation(string locale)
    {
        return Translations.ContainsKey(locale);
    }
}
