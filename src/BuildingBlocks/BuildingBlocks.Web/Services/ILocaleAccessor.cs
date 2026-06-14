namespace BuildingBlocks.Web.Services;

/// <summary>
/// Provides an interface for managing locale information from the current context.
/// </summary>
public interface ILocaleAccessor
{
    /// <summary>
    /// Gets the current locale from the request context.
    /// </summary>
    string CurrentLocale { get; }

    /// <summary>
    /// Gets the current culture from the request context.
    /// </summary>
    string CurrentCulture { get; }

    /// <summary>
    /// Gets all supported locales.
    /// </summary>
    IEnumerable<string> SupportedLocales { get; }

    /// <summary>
    /// Determines whether the specified locale is supported.
    /// </summary>
    /// <param name="locale">The locale to check.</param>
    /// <returns>True if the locale is supported; otherwise, false.</returns>
    bool IsLocaleSupported(string locale);

    /// <summary>
    /// Gets the default locale.
    /// </summary>
    string DefaultLocale { get; }
}
