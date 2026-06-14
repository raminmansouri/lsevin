using System.Globalization;
using BuildingBlocks.Web.Constants;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Web.Services;

/// <summary>
/// Service class for managing locale information from the current HTTP context.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="LocaleAccessor"/> class.
/// </remarks>
/// <param name="httpContextAccessor">The HTTP context accessor.</param>
public sealed class LocaleAccessor(IHttpContextAccessor httpContextAccessor) : ILocaleAccessor
{
    private static readonly string[] _supportedLocales =
    [
        WebConstants.Language.EnglishLanguage,
        WebConstants.Language.PersianLanguage,
        WebConstants.Language.ArabicLanguage,
        WebConstants.Language.SpanishLanguage,
        WebConstants.Language.TurkishLanguage,
    ];

    /// <inheritdoc />
    public string CurrentLocale => GetCurrentLocaleFromContext();

    /// <inheritdoc />
    public string CurrentCulture => GetCurrentCultureFromContext();

    /// <inheritdoc />
    public IEnumerable<string> SupportedLocales => _supportedLocales;

    /// <inheritdoc />
    public string DefaultLocale => WebConstants.Language.EnglishLanguage;

    /// <inheritdoc />
    public bool IsLocaleSupported(string locale)
    {
        return _supportedLocales.Contains(locale, StringComparer.OrdinalIgnoreCase);
    }

    private string GetCurrentLocaleFromContext()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return DefaultLocale;
        }

        // Try to get from current thread culture first
        var currentCulture = CultureInfo.CurrentCulture.Name;
        if (IsLocaleSupported(currentCulture))
        {
            return currentCulture;
        }

        // Try to get from current UI culture
        var currentUICulture = CultureInfo.CurrentUICulture.Name;
        if (IsLocaleSupported(currentUICulture))
        {
            return currentUICulture;
        }

        // Try to get from Accept-Language header
        var acceptLanguage = httpContext.Request.Headers.AcceptLanguage.FirstOrDefault();
        if (!string.IsNullOrEmpty(acceptLanguage))
        {
            // Parse the Accept-Language header and find the first supported locale
            var languages = acceptLanguage
                .Split(',')
                .Select(lang => lang.Split(';')[0].Trim())
                .Where(lang => !string.IsNullOrEmpty(lang));

            foreach (var language in languages)
            {
                if (IsLocaleSupported(language))
                {
                    return language;
                }

                // Try to match language part only (e.g., "en" from "en-GB")
                var languageCode = language.Split('-')[0];
                var matchingLocale = _supportedLocales.FirstOrDefault(locale =>
                    locale.StartsWith(languageCode, StringComparison.OrdinalIgnoreCase)
                );

                if (!string.IsNullOrEmpty(matchingLocale))
                {
                    return matchingLocale;
                }
            }
        }

        // Return default locale if nothing else matches
        return DefaultLocale;
    }

    private static string GetCurrentCultureFromContext()
    {
        return CultureInfo.CurrentCulture.Name;
    }
}
