using System.Collections.Concurrent;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Reflection;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BuildingBlocks.Core.Persistence.Converters;

/// <summary>
/// Represents a value converter selector for strongly typed identifier values.
/// </summary>
/// <remarks>
/// Based on https://andrewlock.net/strongly-typed-ids-in-ef-core-using-strongly-typed-entity-ids-to-avoid-primitive-obsession-part-4/.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="StronglyTypedIdValueConverterSelector"/> class.
/// </remarks>
/// <param name="dependencies">The dependencies for the value converter selector.</param>
internal sealed class StronglyTypedIdValueConverterSelector(ValueConverterSelectorDependencies dependencies)
    : ValueConverterSelector(dependencies)
{
    /// <summary>
    /// The collection of value converters.
    /// </summary>
    private readonly ConcurrentDictionary<(Type ModelClrType, Type ProviderClrType), ValueConverterInfo> _converters =
        new();

    /// <summary>
    /// Selects the value converters for the specified model and provider types.
    /// </summary>
    /// <param name="modelClrType">The model CLR type.</param>
    /// <param name="providerClrType">The provider CLR type.</param>
    /// <returns>The collection of value converters.</returns>
    public override IEnumerable<ValueConverterInfo> Select(Type modelClrType, Type? providerClrType = null)
    {
        foreach (var converter in base.Select(modelClrType, providerClrType))
        {
            yield return converter;
        }

        var underlyingModelType = UnwrapNullableType(modelClrType);
        var underlyingProviderType = UnwrapNullableType(providerClrType);

        if (underlyingProviderType is not null && underlyingProviderType != typeof(Guid))
        {
            yield break;
        }

        var isTypedIdValue = typeof(TypedIdValueBase).IsAssignableFrom(underlyingModelType);
        if (!isTypedIdValue || underlyingModelType is null)
        {
            yield break;
        }

        var converterType = typeof(TypedIdValueConverter<>).MakeGenericType(underlyingModelType);

        yield return _converters.GetOrAdd(
            (underlyingModelType, typeof(Guid)),
            _ => new ValueConverterInfo(
                modelClrType: modelClrType,
                providerClrType: typeof(Guid),
                factory: valueConverterInfo =>
                    converterType.CreateInstanceFromType<ValueConverter>(valueConverterInfo.MappingHints!)!
            )
        );
    }

    /// <summary>
    /// Unwraps the nullable type.
    /// </summary>
    /// <param name="type">The type to unwrap.</param>
    /// <returns>The unwrapped type.</returns>
    private static Type? UnwrapNullableType(Type? type)
    {
        if (type is null)
        {
            return null;
        }

        return Nullable.GetUnderlyingType(type) ?? type;
    }
}
