using System.ComponentModel.DataAnnotations;

namespace BuildingBlocks.Core.Dtos.Localization;

/// <summary>
/// Data transfer object for a single translation entry.
/// </summary>
/// <param name="Locale">The locale code (e.g., "en-US", "fa-IR", "ar-SA", "es-ES", "tr-TR", "ku-KU", "de-DE", "fr-FR").</param>
/// <param name="Value">The translation value.</param>
public sealed record TranslationDto(
    [property: Required, MinLength(2), MaxLength(10)] string Locale,
    [property: Required] string Value
)
{
    /// <summary>
    /// Creates a new translation DTO.
    /// </summary>
    /// <param name="locale">The locale code.</param>
    /// <param name="value">The translation value.</param>
    /// <returns>A new <see cref="TranslationDto"/>.</returns>
    public static TranslationDto Create(string locale, string value)
    {
        return new TranslationDto(locale, value);
    }
}
