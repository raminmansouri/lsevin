using System.Text.Json.Serialization;

namespace BuildingBlocks.Core.Dtos.Localization;

/// <summary>
/// Base record for DTOs that contain localized responses.
/// </summary>
/// <param name="Locale">The current locale used for this response.</param>
/// <param name="HasAllTranslations">Whether this response contains all translations.</param>
/// <param name="AvailableLocales">The available locales for this content.</param>
public abstract record LocalizedResponseDto(
    [property: JsonPropertyName("locale")] string? Locale,
    [property: JsonPropertyName("hasAllTranslations")] bool HasAllTranslations,
    [property: JsonPropertyName("availableLocales")] IEnumerable<string>? AvailableLocales
);

/// <summary>
/// Response DTO for localized content with full translations.
/// </summary>
/// <param name="Translations">The translations dictionary.</param>
/// <param name="AvailableLocales">The available locales.</param>
public sealed record LocalizedContentResponseDto(
    [property: JsonPropertyName("translations")] Dictionary<string, string> Translations,
    [property: JsonPropertyName("availableLocales")] IEnumerable<string> AvailableLocales
)
{
    /// <summary>
    /// Creates a response from a translations dictionary.
    /// </summary>
    /// <param name="translations">The translations dictionary.</param>
    /// <returns>A new <see cref="LocalizedContentResponseDto"/>.</returns>
    public static LocalizedContentResponseDto FromTranslations(Dictionary<string, string> translations)
    {
        return new LocalizedContentResponseDto(translations, translations.Keys);
    }
}
