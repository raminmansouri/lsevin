namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the page list.
/// </summary>
/// <typeparam name="T">The type of the items.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="PageList{T}"/> class.
/// </remarks>
/// <param name="Items">The items.</param>
/// <param name="PageNumber">The page number.</param>
/// <param name="PageSize">The page size.</param>
/// <param name="TotalCount">The total count.</param>
public record PageList<T>(IReadOnlyList<T> Items, int PageNumber, int PageSize, int TotalCount) : IPageList<T>
    where T : class
{
    public int CurrentPageSize => Items.Count;

    /// <inheritdoc />
    public int CurrentStartIndex => TotalCount == 0 ? 0 : ((PageNumber - 1) * PageSize) + 1;

    /// <inheritdoc />
    public int CurrentEndIndex => TotalCount == 0 ? 0 : CurrentStartIndex + CurrentPageSize - 1;

    /// <inheritdoc />
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);

    /// <inheritdoc />
    public bool HasPrevious => PageNumber > 1;

    /// <inheritdoc />
    public bool HasNext => PageNumber < TotalPages;

    /// <summary>
    /// Gets an empty page list.
    /// </summary>
    public static PageList<T> Empty => new(Enumerable.Empty<T>().ToList(), 0, 0, 0);

    /// <summary>
    /// Creates a new page list.
    /// </summary>
    /// <param name="items">The items.</param>
    /// <param name="pageNumber">The page number.</param>
    /// <param name="pageSize">The page size.</param>
    /// <param name="totalItems">The total items.</param>
    /// <returns>The page list.</returns>
    public static PageList<T> Create(IReadOnlyList<T> items, int pageNumber, int pageSize, int totalItems)
    {
        return new PageList<T>(items, pageNumber, pageSize, totalItems);
    }

    /// <summary>
    /// Maps the items to the specified type.
    /// </summary>
    /// <typeparam name="TR">The type of the result.</typeparam>
    /// <param name="map">The mapping function.</param>
    /// <returns>The mapped page list.</returns>
    public IPageList<TR> MapTo<TR>(Func<T, TR> map)
        where TR : class
    {
        return PageList<TR>.Create(Items.Select(map).ToList(), PageNumber, PageSize, TotalCount);
    }
}
