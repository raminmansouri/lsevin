using System.Data;
using BuildingBlocks.Core.Domain.Primitives;
using Dapper;

namespace BuildingBlocks.Core.Persistence.Converters;

/// <summary>
/// Represents a type handler for a typed identifier value.
/// </summary>
/// <typeparam name="T">The type of the typed identifier value.</typeparam>
public sealed class TypedIdValueHandler<T> : SqlMapper.TypeHandler<T>
    where T : TypedIdValueBase
{
    /// <inheritdoc />
    public override T Parse(object value)
    {
        return (T)Activator.CreateInstance(typeof(T), [(Guid)value])!;
    }

    /// <inheritdoc />
    public override void SetValue(IDbDataParameter parameter, T? value)
    {
        parameter.Value = value?.Value;
    }
}
