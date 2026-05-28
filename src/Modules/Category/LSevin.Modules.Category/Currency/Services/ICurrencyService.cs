using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.Currency.Services;

public interface ICurrencyService : IDomainService
{
    decimal ConvertPrice(
        decimal price,
        string currencySymbol
    );


    Task<decimal> ConvertPriceAsync(
        decimal price,
        string serviceCurrencySymbol
    );

    string? ConvertCurrencySymbol(string argCurrency);
}
