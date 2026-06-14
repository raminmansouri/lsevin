using System.Globalization;
using BuildingBlocks.Web.Constants;
using BuildingBlocks.Web.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Localization;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Extensions;

/// <summary>
/// Extension methods for registering localization services.
/// </summary>
public static class LocalizationExtensions
{
    /// <summary>
    /// Registers localization services including ILocaleAccessor.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddLocalizationServices(this IServiceCollection services)
    {
        services.AddScoped<ILocaleAccessor, LocaleAccessor>();

        return services;
    }

    /// <summary>
    /// Configures localization with English, Persian, Arabic, Spanish, and Turkish cultures for the application.
    /// </summary>
    /// <param name="app">The WebApplication instance to configure.</param>
    /// <returns>The configured WebApplication instance.</returns>
    public static WebApplication UseLocalization(this WebApplication app)
    {
        var englishCulture = new CultureInfo(WebConstants.Language.EnglishLanguage);
        var persianCulture = new CultureInfo(WebConstants.Language.PersianLanguage);
        var arabicCulture = new CultureInfo(WebConstants.Language.ArabicLanguage);
        var spanishCulture = new CultureInfo(WebConstants.Language.SpanishLanguage);
        var turkishCulture = new CultureInfo(WebConstants.Language.TurkishLanguage);

        app.UseRequestLocalization(options =>
        {
            options.ApplyCurrentCultureToResponseHeaders = true;
            options.DefaultRequestCulture = new RequestCulture(
                WebConstants.Language.PersianLanguage,
                WebConstants.Language.PersianLanguage
            );
            options.SupportedCultures = [englishCulture, persianCulture, arabicCulture, spanishCulture, turkishCulture];
            options.SupportedUICultures =
            [
                englishCulture,
                persianCulture,
                arabicCulture,
                spanishCulture,
                turkishCulture,
            ];
        });

        return app;
    }
}
