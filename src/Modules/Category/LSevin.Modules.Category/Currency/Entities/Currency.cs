using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.Category.ValueObjects;

namespace LSevin.Modules.Category.Currency.Entities;

public sealed class Currency : AggregateRoot<CurrencyId>
{
    public Currency(string name, string symbol, decimal price)
    {
        Id = CurrencyId.Create(IdGenerator.NewId());
        this.Name = name;
        Symbol = symbol;
        Price = price;
    }


    #region Properties

    public string Name { get; private set; }
    public string Symbol{ get; private set; }
    public decimal Price{ get; private set; }

    #endregion


    #region methods

    public static List<Currency> Seed()
    {
        return new List<Currency>
        {
            Create("USD", "USD", 1.0m),
            Create("EUR", "EUR", 0.85m),
            Create("GBP", "GBP", 0.75m),
            Create("JPY", "JPY", 110.0m),
            Create("ریال", "IRR", 110.0m),
            Create("TRY", "TRY", 110.0m),
            Create("KWD", "KWD", 110.0m),
            Create("SAR", "SAR", 110.0m),
            Create("CHF", "CHF", 0.92m)
        };
    }

    public static Currency Create(string v1, string v2, decimal v3)
    {
        return new Currency(v1, v2, v3);
    }
    #endregion

}
