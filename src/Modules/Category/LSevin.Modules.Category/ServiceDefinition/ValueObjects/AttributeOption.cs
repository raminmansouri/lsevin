using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ServiceDefinition.ValueObjects;

public sealed class AttributeOption : ValueObject
{
    public LocalizedString DisplayName { get; }
    public LocalizedString Value { get; }
    public decimal? AdditionalPrice { get; }

    private AttributeOption()
    {
        DisplayName = null!;
        Value = null!;
    }

    [JsonConstructor]
    private AttributeOption(LocalizedString displayName, LocalizedString value, decimal? additionalPrice)
        : this()
    {
        DisplayName = displayName;
        Value = value;
        AdditionalPrice = additionalPrice;
    }

    public static AttributeOption Create(
        LocalizedString displayName,
        LocalizedString value,
        decimal? additionalPrice = null
    )
    {
        Guard.Against.Null(displayName, nameof(displayName));
        Guard.Against.Null(value, nameof(value));

        return new AttributeOption(displayName, value, additionalPrice);
    }

    public void Deconstruct(out LocalizedString displayName, out LocalizedString value, out decimal? additionalPrice)
    {
        displayName = DisplayName;
        value = Value;
        additionalPrice = AdditionalPrice;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return DisplayName;
        yield return Value;

        if (AdditionalPrice.HasValue)
        {
            yield return AdditionalPrice.Value;
        }
    }
}

public static partial class EntityConfiguration
{
    public static void Configure<T>(this OwnedNavigationBuilder<T, AttributeOption> builder)
        where T : class
    {
        builder
            .Property(p => p.DisplayName)
            .ConfigureLocalizedStringNonNullable<T>(
                nameof(AttributeOption.DisplayName).Underscore() + EfConstants.LocalizedTablePostfix
            // DomainConstValues.AttributeOptionDisplayNameMaxLength * 10
            );

        builder
            .Property(p => p.Value)
            .ConfigureLocalizedStringNonNullable<T>(
                nameof(AttributeOption.Value).Underscore() + EfConstants.LocalizedTablePostfix
            // DomainConstValues.AttributeOptionValueMaxLength * 10
            );

        builder
            .Property(p => p.AdditionalPrice)
            .HasColumnName(nameof(AttributeOption.AdditionalPrice).Underscore())
            .HasColumnType(EfConstants.ColumnTypes.PriceDecimal);
    }
}
