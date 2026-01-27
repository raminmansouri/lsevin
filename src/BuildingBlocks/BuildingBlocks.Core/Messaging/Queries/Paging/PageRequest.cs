using BuildingBlocks.Core.Persistence.Extensions;

namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the page request.
/// </summary>
public record PageRequest : IPageRequest
{
    /// <summary>
    /// Gets the page number.
    /// </summary>
    public int PageNumber { get; init; } = PageConstants.DefaultPageNumber;

    /// <summary>
    /// Gets the page size.
    /// </summary>
    public int PageSize { get; init; } = PageConstants.DefaultPageSize;

    /// <summary>
    /// Gets the filters.
    /// </summary>
    public string? Filters { get; init; }

    /// <summary>
    /// Gets the sort order.
    /// </summary>
    public string? SortOrder { get; init; }

    /// <summary>
    /// Gets the optional start date for filtering.
    /// </summary>
    public DateTime? StartDate { get; init; }

    /// <summary>
    /// Gets the optional end date for filtering.
    /// </summary>
    public DateTime? EndDate { get; init; }

    /// <summary>
    /// Deconstructs the page request.
    /// </summary>
    /// <param name="pageNumber">The page number.</param>
    /// <param name="pageSize">The page size.</param>
    /// <param name="filters">The filters.</param>
    /// <param name="sortOrder">The sort order.</param>
    public void Deconstruct(out int pageNumber, out int pageSize, out string? filters, out string? sortOrder) =>
        (pageNumber, pageSize, filters, sortOrder) = (PageNumber, PageSize, Filters, SortOrder);

    /// <summary>
    /// Deconstructs the page request including date range.
    /// </summary>
    /// <param name="pageNumber">The page number.</param>
    /// <param name="pageSize">The page size.</param>
    /// <param name="filters">The filters.</param>
    /// <param name="sortOrder">The sort order.</param>
    /// <param name="startDate">The start date.</param>
    /// <param name="endDate">The end date.</param>
    public void Deconstruct(
        out int pageNumber,
        out int pageSize,
        out string? filters,
        out string? sortOrder,
        out DateTime? startDate,
        out DateTime? endDate
    ) =>
        (pageNumber, pageSize, filters, sortOrder, startDate, endDate) = (
            PageNumber,
            PageSize,
            Filters,
            SortOrder,
            StartDate,
            EndDate
        );

    /// <summary>
    /// Deconstructs the page request.
    /// </summary>
    /// <typeparam name="T">The type of the query.</typeparam>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <returns>The page request.</returns>
    public T Of<T, TResponse>()
        where T : PageQuery<TResponse>, new()
        where TResponse : notnull
    {
        return new T
        {
            PageNumber = PageNumber,
            PageSize = PageSize,
            SortOrder = SortOrder,
            Filters = Filters,
            StartDate = StartDate,
            EndDate = EndDate,
        };
    }

    /// <summary>
    /// Gets the filter models from the Filters string.
    /// </summary>
    /// <returns>Collection of filter models.</returns>
    public IList<FilterModel> GetFilterModels()
    {
        return Filters?.ParseFilterString() ?? new List<FilterModel>();
    }
}
