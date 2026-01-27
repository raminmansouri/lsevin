namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents a paginated result model.
/// </summary>
/// <typeparam name="T">The type of the items.</typeparam>
public sealed record ListResultModel<T>(IList<T> Items, long TotalItems, int Page, int PageSize)
    where T : notnull
{
    /// <summary>
    /// Gets the empty paginated result model.
    /// </summary>
    public static ListResultModel<T> Empty => new(Enumerable.Empty<T>().ToList(), 0, 0, 0);

    /// <summary>
    /// Creates a new instance of <see cref="ListResultModel{T}"/>.
    /// </summary>
    /// <param name="items">The items.</param>
    /// <param name="totalItems">The total items.</param>
    /// <param name="page">The page.</param>
    /// <param name="pageSize">The page size.</param>
    /// <returns>The <see cref="ListResultModel{T}"/>.</returns>
    public static ListResultModel<T> Create(IList<T> items, long totalItems = 0, int page = 1, int pageSize = 20)
    {
        return new ListResultModel<T>(items, totalItems, page, pageSize);
    }

    /// <summary>
    /// Maps the items to a new type.
    /// </summary>
    /// <typeparam name="TU">The type to map to.</typeparam>
    /// <param name="map">The mapping function.</param>
    /// <returns>The mapped <see cref="ListResultModel{U}"/>.</returns>
    public ListResultModel<TU> Map<TU>(Func<T, TU> map)
        where TU : notnull
    {
        return ListResultModel<TU>.Create([.. Items.Select(map)], TotalItems, Page, PageSize);
    }
}
