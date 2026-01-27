namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the page list.
/// </summary>
/// <typeparam name="T">The type of the item.</typeparam>
public interface IPageList<T>
    where T : notnull
{
    /// <summary>
    /// Gets the current page number.
    /// </summary>
    int CurrentPageSize { get; }

    /// <summary>
    /// Gets the current page number.
    /// </summary>
    int CurrentStartIndex { get; }

    /// <summary>
    /// Gets the current page number.
    /// </summary>
    int CurrentEndIndex { get; }

    /// <summary>
    /// Gets the total pages.
    /// </summary>
    int TotalPages { get; }

    /// <summary>
    /// Gets a value indicating whether there are previous pages.
    /// </summary>
    bool HasPrevious { get; }

    /// <summary>
    /// Gets a value indicating whether there are next pages.
    /// </summary>
    bool HasNext { get; }

    /// <summary>
    /// Gets the items.
    /// </summary>
    IReadOnlyList<T> Items { get; init; }

    /// <summary>
    /// Gets the total count.
    /// </summary>
    int TotalCount { get; init; }

    /// <summary>
    /// Gets the page number.
    /// </summary>
    int PageNumber { get; init; }

    /// <summary>
    /// Gets the page size.
    /// </summary>
    int PageSize { get; init; }

    /// <summary>
    /// Maps the items to the specified type.
    /// </summary>
    /// <typeparam name="TR">The type to map to.</typeparam>
    /// <param name="map">The mapping function.</param>
    /// <returns>The mapped items.</returns>
    IPageList<TR> MapTo<TR>(Func<T, TR> map)
        where TR : class;
}
