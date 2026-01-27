using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Reflection;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BuildingBlocks.Core.Persistence.Converters;

/// <summary>
/// Represents a value converter for a typed identifier value.
/// </summary>
/// <typeparam name="TTypedIdValue">The type of the typed identifier value.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="TypedIdValueConverter{TTypedIdValue}"/> class.
/// </remarks>
/// <param name="mappingHints">The mapping hints for the converter.</param>
internal sealed class TypedIdValueConverter<TTypedIdValue>(ConverterMappingHints? mappingHints = null)
    : ValueConverter<TTypedIdValue, Guid>(
        id => id.Value,
        value => Create(value),
        mappingHints ?? new ConverterMappingHints()
    )
    where TTypedIdValue : TypedIdValueBase
{
    /// <summary>
    /// Creates a new instance of the typed identifier value.
    /// </summary>
    /// <param name="id">The unique identifier value.</param>
    /// <returns>The new instance of the typed identifier value.</returns>
    private static TTypedIdValue Create(Guid id) =>
        typeof(TTypedIdValue).CreateInstanceFromType<TTypedIdValue>(id)
        ?? throw new InvalidOperationException("Cannot create instance of TypedIdValue.");
}
