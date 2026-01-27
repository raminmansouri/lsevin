namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the page request.
/// </summary>
public interface IPageRequest
{
    /// <summary>
    /// Gets the page number.
    /// </summary>
    int PageNumber { get; init; }

    /// <summary>
    /// Gets the page size.
    /// </summary>
    int PageSize { get; init; }

    /// <summary>
    /// Gets the filters.
    /// </summary>
    string? Filters { get; init; }

    /// <summary>
    /// Gets the sort order.
    /// </summary>
    string? SortOrder { get; init; }

    /// <summary>
    /// Gets the optional start date for filtering.
    /// </summary>
    DateTime? StartDate { get; init; }

    /// <summary>
    /// Gets the optional end date for filtering.
    /// </summary>
    DateTime? EndDate { get; init; }
}
