using System.Text.Json.Serialization;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence;
using Humanizer;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Category.ProviderType.ValueObjects;

public sealed class AttributeOption : ValueObject
{
    public LocalizedString DisplayName { get; }
    public LocalizedString Value { get; }

    private AttributeOption()
    {
        DisplayName = null!;
        Value = null!;
    }

    [JsonConstructor]
    private AttributeOption(LocalizedString displayName, LocalizedString value)
        : this()
    {
        DisplayName = displayName;
        Value = value;
    }

    public static AttributeOption Create(LocalizedString displayName, LocalizedString value)
    {
        Guard.Against.Null(displayName, nameof(displayName));
        Guard.Against.Null(value, nameof(value));

        return new AttributeOption(displayName, value);
    }

    public void Deconstruct(out LocalizedString displayName, out LocalizedString value)
    {
        displayName = DisplayName;
        value = Value;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return DisplayName;
        yield return Value;
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
    }
}
