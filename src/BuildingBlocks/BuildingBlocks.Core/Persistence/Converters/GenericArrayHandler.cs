using System.Data;
using Dapper;

namespace BuildingBlocks.Core.Persistence.Converters;

/// <summary>
/// Represents a type handler for an array of generic type.
/// </summary>
/// <typeparam name="T">The type of the array.</typeparam>
internal sealed class GenericArrayHandler<T> : SqlMapper.TypeHandler<T[]>
{
    /// <inheritdoc />
    public override void SetValue(IDbDataParameter parameter, T[]? value)
    {
        parameter.Value = value;
    }

    /// <inheritdoc />
    public override T[]? Parse(object value)
    {
        return value as T[];
    }
}
