namespace BuildingBlocks.Core.Extensions;

/// <summary>
/// Represents the collection extensions.
/// </summary>
public static class CollectionExtensions
{
    /// <summary>
    /// Adds an item to a list if it's not null.
    /// </summary>
    /// <param name="list">The list.</param>
    /// <param name="item">The item.</param>
    /// <typeparam name="T">The type of the item.</typeparam>
    public static void AddIfNotNullAndNotExists<T>(this IList<T> list, T? item)
        where T : class
    {
        if (item is not null && !list.Contains(item))
        {
            list.Add(item);
        }
    }

    /// <summary>
    /// Adds a struct item to a list if it's not null.
    /// </summary>
    /// <param name="list">The list.</param>
    /// <param name="item">The item.</param>
    /// <typeparam name="T">The type of the item.</typeparam>
    public static void AddIfNotNullAndNotExists<T>(this IList<T> list, T? item)
        where T : struct
    {
        if (item is not null)
        {
            list.Add(item.Value);
        }
    }

    /// <summary>
    /// Adds a range of items to a list if they're not null.
    /// </summary>
    /// <param name="list">The list.</param>
    /// <param name="items">The items.</param>
    /// <typeparam name="T">The type of the item.</typeparam>
    public static void AddRangeIfNotNull<T>(this IList<T> list, IEnumerable<T?> items)
        where T : class
    {
        foreach (var item in items)
        {
            list.AddIfNotNullAndNotExists(item);
        }
    }

    /// <summary>
    /// Removes all null items from a list.
    /// </summary>
    /// <param name="list">The list.</param>
    /// <typeparam name="T">The type of the item.</typeparam>
    public static void RemoveAllNulls<T>(this IList<T?> list)
        where T : class
    {
        for (var i = list.Count - 1; i >= 0; i--)
        {
            if (list[i] == null)
            {
                list.RemoveAt(i);
            }
        }
    }
}
