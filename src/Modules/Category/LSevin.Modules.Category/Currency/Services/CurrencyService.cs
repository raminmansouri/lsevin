using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.Services;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.Currency.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Caching.Memory;

internal sealed class CurrencyService(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor,
    IMemoryCache cache
) : ICurrencyService
{
    private const string BaseSymbol = "IRR";

    private static readonly Dictionary<string, string> LocaleCurrencyMap = new()
    {
        ["en-US"] = "USD",
        ["fa-IR"] = "IRR",
        ["tr-TR"] = "TRY",
        ["es-ES"] = "EUR",
        ["ar-SA"] = "SAR",
        ["ku-KU"] = "KWD",
        ["de-DE"] = "EUR",
        ["fr-FR"] = "EUR"
    };

    private static string RateCacheKey(string symbol) => $"currency-rate:{symbol}";
    private static string NameCacheKey(string symbol) => $"currency-name:{symbol}";

    public decimal ConvertPrice(decimal priceInIrr, string? overrideCurrencySymbol = null)
        => ConvertPriceAsync(priceInIrr, overrideCurrencySymbol).GetAwaiter().GetResult();

    public async Task<decimal> ConvertPriceAsync(decimal price, string? serviceCurrencySymbol = null)
    {
        // What currency is the service price expressed in?
        var serviceSymbol = ResolveCurrencySymbol(serviceCurrencySymbol); // defaults to IRR if null/unknown
        // What currency should we display in (based on current locale)?
        var targetSymbol = ResolveCurrencySymbolFromLocale(localeAccessor.CurrentLocale)
                           ?? ResolveCurrencySymbolFromLocale(localeAccessor.DefaultLocale)
                           ?? BaseSymbol;

        serviceSymbol = serviceSymbol.Trim().ToUpperInvariant();
        targetSymbol  = targetSymbol.Trim().ToUpperInvariant();

        // If service price is already in target currency, just round appropriately.
        if (serviceSymbol == targetSymbol)
            return Round(price, targetSymbol);

        // Step 1: service currency -> IRR
        decimal priceInIrr;
        if (serviceSymbol == BaseSymbol)
        {
            priceInIrr = price;
        }
        else
        {
            var irrPerOneService = await GetRateCachedAsync(serviceSymbol); // IRR per 1 service unit
            priceInIrr = price * irrPerOneService;
        }

        // Step 2: IRR -> target currency
        if (targetSymbol == BaseSymbol)
            return Round(priceInIrr, BaseSymbol);

        var irrPerOneTarget = await GetRateCachedAsync(targetSymbol); // IRR per 1 target unit
        var converted = priceInIrr / irrPerOneTarget;

        return Round(converted, targetSymbol);
    }

    private string ResolveCurrencySymbol(string? symbol)
    {
        if (!string.IsNullOrWhiteSpace(symbol))
            return symbol.Trim().ToUpperInvariant();

        // If service currency is missing, assume IRR (base).
        return BaseSymbol;
    }

    private string? ResolveCurrencySymbolFromLocale(string? locale)
    {
        if (string.IsNullOrWhiteSpace(locale))
            return null;

        return LocaleCurrencyMap.TryGetValue(locale, out var symbol)
            ? symbol
            : null;
    }


    public string? ConvertCurrencySymbol(string argCurrency)
    {
        var targetSymbol = ResolveCurrencySymbolFromLocale(localeAccessor.CurrentLocale)
                           ?? ResolveCurrencySymbolFromLocale(localeAccessor.DefaultLocale)
                           ?? BaseSymbol;
        targetSymbol  = targetSymbol.Trim().ToUpperInvariant();

        return GetNameCachedAsync(targetSymbol).GetAwaiter().GetResult();
    }

    private string? GetLocaleCurrencySymbol(string? locale)
    {
        string currencySymbol;
        if (!LocaleCurrencyMap.TryGetValue(locale, out currencySymbol))
            return null;

            return currencySymbol;

    }


    private async Task<decimal> GetRateCachedAsync(string symbol)
    {
        // IMemoryCache has GetOrCreateAsync which is thread-safe per key
        return await cache.GetOrCreateAsync(RateCacheKey(symbol), async entry =>
        {
            // Set this to slightly below your update frequency
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);

            using var conn = await dbConnectionFactory.GetOrCreateConnectionAsync();

            const string sql = """
                               SELECT price
                               FROM category.currencies
                               WHERE symbol = @Symbol
                               """;

            var rate = await conn.QuerySingleOrDefaultAsync<decimal?>(sql, new { Symbol = symbol });

            if (rate is null || rate <= 0)
                throw new InvalidOperationException($"Invalid currency rate for '{symbol}'.");

            return rate.Value;
        }) ;
    }




    private async Task<string?> GetNameCachedAsync(string symbol)
    {
        // IMemoryCache has GetOrCreateAsync which is thread-safe per key
        return await cache.GetOrCreateAsync(NameCacheKey(symbol), async entry =>
        {
            // Set this to slightly below your update frequency
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);

            using var conn = await dbConnectionFactory.GetOrCreateConnectionAsync();

            const string sql = """
                               SELECT name
                               FROM category.currencies
                               WHERE symbol = @Symbol
                               """;

            var name = await conn.QuerySingleOrDefaultAsync<string?>(sql, new { Symbol = symbol });

            if (name is null )
                throw new InvalidOperationException($"Invalid currency rate for '{symbol}'.");

            return name;
        }) ;
    }

    private static decimal Round(decimal value, string symbol)
    {
        var decimals = symbol switch
        {
            "JPY" => 0,
            "IRR" => 0,
            _ => 2
        };

        return Math.Round(value, decimals, MidpointRounding.AwayFromZero);
    }
}