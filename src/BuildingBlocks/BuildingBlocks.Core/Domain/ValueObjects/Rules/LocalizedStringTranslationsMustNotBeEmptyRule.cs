using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.Domain.ValueObjects.Rules;

/// <summary>
/// Business rule that ensures all translations in a localized string are not null or empty.
/// </summary>
internal sealed class LocalizedStringTranslationsMustNotBeEmptyRule : IBusinessRule
{
    private readonly IDictionary<string, string> _translations;

    /// <summary>
    /// Initializes a new instance of the <see cref="LocalizedStringTranslationsMustNotBeEmptyRule"/> class.
    /// </summary>
    /// <param name="translations">The translations to validate.</param>
    public LocalizedStringTranslationsMustNotBeEmptyRule(IDictionary<string, string> translations)
    {
        _translations = translations;
    }

    /// <inheritdoc />
    public string Message => SharedResource.Localized_String_Translations_Must_Not_Be_Empty_Error_Message;

    /// <inheritdoc />
    public bool IsBroken() =>
        _translations.Any(t => string.IsNullOrWhiteSpace(t.Key) || string.IsNullOrWhiteSpace(t.Value));
}
