using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Conversions;

/// <summary>
/// Represents a class for conversion operations.
/// </summary>
public static class TypedIdConversions
{
    /// <summary>
    /// Converts a single typed identifier to a GUID.
    /// </summary>
    /// <typeparam name="TId">The type of the typed identifier.</typeparam>
    /// <param name="id">The typed identifier.</param>
    /// <param name="creator">The creator function.</param>
    /// <returns>The converted GUID.</returns>
    public static TId ConvertToId<TId>(this Guid id, Func<Guid, TId> creator)
        where TId : TypedIdValueBase
    {
        return creator(id);
    }

    /// <summary>
    /// Converts the specified typed identifier to a GUID.
    /// </summary>
    /// <typeparam name="TId">The type of the typed identifier.</typeparam>
    /// <param name="guids">The typed identifiers.</param>
    /// <param name="creator">The creator function.</param>
    /// <returns>The converted GUIDs.</returns>
    public static IReadOnlyList<TId> ConvertToIds<TId>(this IReadOnlyCollection<Guid> guids, Func<Guid, TId> creator)
        where TId : TypedIdValueBase
    {
        return [.. guids.Distinct().Select(creator)];
    }

    /// <summary>
    /// Converts a single typed identifier to a GUID.
    /// </summary>
    /// <typeparam name="TId">The type of the typed identifier.</typeparam>
    /// <param name="id">The typed identifier.</param>
    /// <returns>The converted GUID.</returns>
    public static Guid ConvertToGuid<TId>(this TId id)
        where TId : TypedIdValueBase
    {
        return id.Value;
    }

    /// <summary>
    /// Converts the specified typed identifier to a GUID.
    /// </summary>
    /// <typeparam name="TId">The type of the typed identifier.</typeparam>
    /// <param name="ids">The typed identifiers.</param>
    /// <returns>The converted GUIDs.</returns>
    public static IReadOnlyList<Guid> ConvertToGuids<TId>(this IReadOnlyCollection<TId> ids)
        where TId : TypedIdValueBase
    {
        return [.. ids.Select(id => id.Value)];
    }

    /// <summary>
    /// Creates the typed identifier if not null.
    /// </summary>
    /// <typeparam name="T">The type of the typed identifier.</typeparam>
    /// <typeparam name="TV">The type of the value.</typeparam>
    /// <param name="value">The value.</param>
    /// <param name="creator">The creator function.</param>
    /// <returns>The created typed identifier.</returns>
    public static T? CreateIfNotNull<T, TV>(this TV? value, Func<TV, T> creator)
        where T : class
        where TV : class
    {
        return value is null ? null : creator(value);
    }
}
