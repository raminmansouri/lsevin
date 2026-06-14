using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.Domain.ValueObjects.Rules;

/// <summary>
/// Business rule that ensures a localized string has at least one translation.
/// </summary>
internal sealed class LocalizedStringMustHaveTranslationsRule : IBusinessRule
{
    private readonly IDictionary<string, string> _translations;

    /// <summary>
    /// Initializes a new instance of the <see cref="LocalizedStringMustHaveTranslationsRule"/> class.
    /// </summary>
    /// <param name="translations">The translations to validate.</param>
    public LocalizedStringMustHaveTranslationsRule(IDictionary<string, string> translations)
    {
        _translations = translations;
    }

    /// <inheritdoc />
    public string Message => SharedResource.Localized_String_Must_Have_Translations_Error_Message;

    /// <inheritdoc />
    public bool IsBroken() => _translations.Count == 0;
}
