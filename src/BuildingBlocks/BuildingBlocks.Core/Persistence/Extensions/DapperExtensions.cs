using System.Text;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using Dapper;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Provides extension methods for working with SQL queries.
/// </summary>
public static class DapperExtensions
{
    #region StringBuilder Core Methods

    /// <summary>
    /// Creates a SQL query builder with initial query text.
    /// </summary>
    /// <param name="initialQuery">The initial SQL query text.</param>
    /// <returns>A StringBuilder initialized with the query.</returns>
    public static StringBuilder CreateSqlBuilder(string initialQuery)
    {
        return new StringBuilder(initialQuery);
    }

    /// <summary>
    /// Appends a WHERE or AND clause based on query state.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="condition">The condition to append.</param>
    /// <returns>The updated query builder.</returns>
    public static StringBuilder AppendWhereOrAnd(this StringBuilder builder, string condition)
    {
        builder.Append(builder.ToString().Contains("WHERE", StringComparison.OrdinalIgnoreCase) ? " AND " : " WHERE ");

        builder.Append(condition);
        return builder;
    }

    /// <summary>
    /// Appends a GROUP BY clause to the query.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="columns">The columns to group by.</param>
    /// <returns>The updated query builder.</returns>
    public static StringBuilder AppendGroupBy(this StringBuilder builder, params string[] columns)
    {
        builder.Append(" GROUP BY ");
        builder.AppendJoin(", ", columns);
        return builder;
    }

    /// <summary>
    /// Wraps a query in a COUNT(*) subquery.
    /// </summary>
    /// <param name="builder">The SQL query builder containing the inner query.</param>
    /// <returns>A new StringBuilder with the count query.</returns>
    public static StringBuilder WrapWithCountQuery(this StringBuilder builder)
    {
        return new StringBuilder($"SELECT COUNT(*) FROM ({builder}) AS tbl");
    }

    #endregion

    #region StringBuilder Filter Methods

    /// <summary>
    /// Appends a conditional filter for a search term across multiple columns.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="searchTerm">The search term to filter by.</param>
    /// <param name="columns">The columns to search in.</param>
    /// <param name="parameters">The parameters' collection.</param>
    /// <param name="paramName">Optional parameter name, defaults to "Search".</param>
    /// <param name="isJsonbColumn">Optional flag indicating if columns are JSONB translation columns.</param>
    /// <returns>The updated query builder.</returns>
    public static StringBuilder AppendSearchFilter(
        this StringBuilder builder,
        string searchTerm,
        IEnumerable<string> columns,
        DynamicParameters parameters,
        string paramName = "Search",
        bool isJsonbColumn = false
    )
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return builder;
        }

        parameters.Add(paramName, searchTerm);

        if (isJsonbColumn)
        {
            // For JSONB translation columns, search within the JSON values
            var conditions = columns.Select(column =>
                $"EXISTS (SELECT 1 FROM jsonb_each_text({column}) WHERE value ILIKE '%' || @{paramName} || '%')"
            );
            return builder.AppendWhereOrAnd($"({string.Join(" OR ", conditions)})");
        }
        else
        {
            // For regular text columns, use direct ILIKE
            var conditions = columns.Select(column => $"{column} ILIKE '%' || @{paramName} || '%'");
            return builder.AppendWhereOrAnd($"({string.Join(" OR ", conditions)})");
        }
    }

    /// <summary>
    /// Appends date range filters to the query.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="startDate">The start date.</param>
    /// <param name="endDate">The end date.</param>
    /// <param name="dateColumn">The date column to filter on.</param>
    /// <param name="parameters">The parameters' collection.</param>
    /// <returns>The updated query builder.</returns>
    public static StringBuilder AppendDateRange(
        this StringBuilder builder,
        DateTime? startDate,
        DateTime? endDate,
        string dateColumn,
        DynamicParameters parameters
    )
    {
        if (startDate.HasValue)
        {
            parameters.Add("StartDate", startDate.Value);
            builder.AppendWhereOrAnd($"{dateColumn} >= @StartDate");
        }

        if (endDate.HasValue)
        {
            parameters.Add("EndDate", endDate.Value);
            builder.AppendWhereOrAnd($"{dateColumn} <= @EndDate");
        }

        return builder;
    }

    /// <summary>
    /// Applies both search and date range filters from a page request.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="request">The page request.</param>
    /// <param name="searchColumns">The columns to search in.</param>
    /// <param name="dateColumn">The date column for filtering.</param>
    /// <param name="parameters">The parameters' collection.</param>
    /// <returns>The updated query builder.</returns>
    public static StringBuilder ApplyStandardFilters(
        this StringBuilder builder,
        PageRequest request,
        IEnumerable<string> searchColumns,
        string dateColumn,
        DynamicParameters parameters
    )
    {
        // Apply date range filters
        if (request.StartDate.HasValue)
        {
            parameters.Add("StartDate", request.StartDate.Value);

            builder.Append(
                builder.ToString().Contains("WHERE", StringComparison.OrdinalIgnoreCase) ? " AND " : " WHERE "
            );

            builder.Append($"{dateColumn} >= @StartDate");
        }

        if (request.EndDate.HasValue)
        {
            parameters.Add("EndDate", request.EndDate.Value);

            builder.Append(
                builder.ToString().Contains("WHERE", StringComparison.OrdinalIgnoreCase) ? " AND " : " WHERE "
            );

            builder.Append($"{dateColumn} <= @EndDate");
        }

        // Apply text search
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            var conditions = searchColumns.Select(column => $"{column} ILIKE '%' || @Search || '%'");

            parameters.Add("Search", request.Filters);

            builder.Append(
                builder.ToString().Contains("WHERE", StringComparison.OrdinalIgnoreCase) ? " AND " : " WHERE "
            );

            builder.Append($"({string.Join(" OR ", conditions)})");
        }

        return builder;
    }

    /// <summary>
    /// Appends SQL WHERE conditions based on filter models using StringBuilder.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="filters">Collection of filter models.</param>
    /// <param name="parameters">The DynamicParameters to add parameters to.</param>
    /// <param name="columnMappings">Optional dictionary to map filter field names to actual database column names.</param>
    /// <returns>The SQL query builder with the added filter conditions.</returns>
    public static StringBuilder AppendFilters(
        this StringBuilder builder,
        IList<FilterModel> filters,
        DynamicParameters parameters,
        IDictionary<string, string>? columnMappings = null
    )
    {
        if (filters.Count == 0)
        {
            return builder;
        }

        var whereConditions = new List<string>();
        var paramIndex = 0;

        foreach (var filter in filters)
        {
            var paramName = $"p{paramIndex++}";

            var columnName =
                columnMappings != null && columnMappings.TryGetValue(filter.FieldName, out var mappedName)
                    ? mappedName
                    : filter.FieldName;

            // Create a filter with the mapped column name
            var mappedFilter = new FilterModel(columnName, filter.Comparision, filter.FieldValue);

            // Build the condition using the helper method
            var condition = BuildFilterCondition(mappedFilter, $"@{paramName}");

            if (!string.IsNullOrEmpty(condition))
            {
                whereConditions.Add(condition);

                // Only add parameter if the comparison operation requires it
                if (filter.Comparision != FilterComparison.IsNull && filter.Comparision != FilterComparison.IsNotNull)
                {
                    if (filter.Comparision is FilterComparison.In or FilterComparison.NotIn)
                    {
                        parameters.Add(paramName, filter.FieldValue.Split(',', StringSplitOptions.RemoveEmptyEntries));
                    }
                    else
                    {
                        parameters.Add(paramName, filter.FieldValue);
                    }
                }
            }
        }

        if (whereConditions.Count > 0)
        {
            if (builder.ToString().Contains("WHERE", StringComparison.OrdinalIgnoreCase))
            {
                builder.Append($" AND ({string.Join(" AND ", whereConditions)})");
            }
            else
            {
                builder.Append($" WHERE {string.Join(" AND ", whereConditions)}");
            }
        }

        return builder;
    }

    /// <summary>
    /// Appends sorting clauses to the query.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="request">The page request.</param>
    /// <param name="allowedColumns">List of columns that are allowed to be sorted.</param>
    /// <param name="fallbackColumn">Optional fallback column to sort by if no sort is specified or found.</param>
    /// <param name="fallbackDirection">Optional fallback direction to sort by if no sort is specified or found.</param>
    /// <param name="ensureDeterministicOrder">If true, always appends the fallback column to ensure deterministic ordering.</param>
    /// <returns>The updated query builder.</returns>
    public static StringBuilder AppendSorting(
        this StringBuilder builder,
        PageRequest request,
        IList<string> allowedColumns,
        string? fallbackColumn = null,
        string? fallbackDirection = null,
        bool ensureDeterministicOrder = false
    )
    {
        var sortClauses = new List<string>();
        var hasSorting = false;

        // Process requested sort if available
        if (!string.IsNullOrWhiteSpace(request.SortOrder) && allowedColumns.Count > 0)
        {
            foreach (var param in request.SortOrder.Split(','))
            {
                var trimmedParam = param.Trim();
                var isDescending = trimmedParam.StartsWith('-');
                var columnName = trimmedParam.TrimStart('-', '+');

                var allowedColumn = allowedColumns.FirstOrDefault(ac =>
                    string.Equals(ac, columnName, StringComparison.OrdinalIgnoreCase)
                );

                if (allowedColumn != null)
                {
                    sortClauses.Add($"{allowedColumn} {(isDescending ? "DESC" : "ASC")}");
                    hasSorting = true;
                }
            }
        }

        // Add fallback sorting if necessary
        if ((!hasSorting || ensureDeterministicOrder) && !string.IsNullOrWhiteSpace(fallbackColumn))
        {
            var fallbackAlreadyIncluded = sortClauses.Exists(sc =>
                sc.StartsWith(fallbackColumn + " ", StringComparison.OrdinalIgnoreCase)
            );

            if (!fallbackAlreadyIncluded)
            {
                sortClauses.Add($"{fallbackColumn} {fallbackDirection ?? "ASC"}");
            }
        }

        // Nothing to add
        if (sortClauses.Count == 0)
            return builder;

        // Check for "ORDER BY" in outer query only
        var outerQuery = builder.ToString();
        var lastFromIndex = outerQuery.LastIndexOf("FROM", StringComparison.OrdinalIgnoreCase);
        var afterFrom = lastFromIndex >= 0 ? outerQuery.Substring(lastFromIndex) : outerQuery;

        var hasOuterOrderBy = afterFrom.Contains("ORDER BY", StringComparison.OrdinalIgnoreCase);

        if (hasOuterOrderBy)
        {
            builder.Append($", {string.Join(", ", sortClauses)}");
        }
        else
        {
            builder.Append($" ORDER BY {string.Join(", ", sortClauses)}");
        }

        return builder;
    }

    /// <summary>
    /// Appends paging clauses (LIMIT/OFFSET) to the query.
    /// </summary>
    /// <param name="builder">The SQL query builder.</param>
    /// <param name="request">The page request.</param>
    /// <param name="parameters">The parameters' collection.</param>
    /// <returns>The updated query builder.</returns>
    public static StringBuilder AppendPaging(
        this StringBuilder builder,
        PageRequest request,
        DynamicParameters parameters
    )
    {
        if (request is { PageNumber: > 0, PageSize: > 0 })
        {
            var skip = (request.PageNumber - 1) * request.PageSize;
            var take = request.PageSize;
            parameters.Add("Skip", skip);
            parameters.Add("Take", take);
            builder.Append(" LIMIT @Take OFFSET @Skip");
        }

        return builder;
    }

    #endregion

    #region String-based Methods (Backward Compatibility)

    /// <summary>
    /// Constructs SQL conditions for search requesting.
    /// </summary>
    /// <param name="request">The request criteria.</param>
    /// <param name="sqlQuery">The SQL query to add the conditions to.</param>
    /// <param name="parameters">The DynamicParameters to add parameters to.</param>
    /// <param name="allowedColumns">List of columns to search in.</param>
    /// <returns>The SQL query with the added conditions.</returns>
    public static string ConstructSearch(
        this PageRequest request,
        string sqlQuery,
        DynamicParameters parameters,
        IList<string> allowedColumns
    )
    {
        var builder = new StringBuilder(sqlQuery);

        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            builder.AppendSearchFilter(request.Filters, allowedColumns, parameters);
        }

        return builder.ToString();
    }

    /// <summary>
    /// Constructs SQL conditions for date range filtering.
    /// </summary>
    /// <param name="request">The request criteria.</param>
    /// <param name="sqlQuery">The SQL query to add the conditions to.</param>
    /// <param name="parameters">The DynamicParameters to add parameters to.</param>
    /// <param name="dateColumnName">The name of the date column to filter on.</param>
    /// <returns>The SQL query with the added date range conditions.</returns>
    public static string ConstructDateRange(
        this PageRequest request,
        string sqlQuery,
        DynamicParameters parameters,
        string dateColumnName
    )
    {
        var builder = new StringBuilder(sqlQuery);
        builder.AppendDateRange(request.StartDate, request.EndDate, dateColumnName, parameters);
        return builder.ToString();
    }

    /// <summary>
    /// Constructs SQL ORDER BY clause based on sort parameters similar to Sieve.
    /// </summary>
    /// <param name="request">The page request containing sort information.</param>
    /// <param name="sqlQuery">The SQL query to add the ORDER BY clause to.</param>
    /// <param name="allowedColumns">List of columns that are allowed to be sorted.</param>
    /// <param name="fallbackColumn">Optional fallback column to sort by if no sort is specified or found.</param>
    /// <param name="fallbackDirection">Optional fallback direction to sort by if no sort is specified or found.</param>
    /// <param name="ensureDeterministicOrder">If true, always appends the fallback column to ensure deterministic ordering.</param>
    /// <returns>The SQL query with the ORDER BY clause added.</returns>
    public static string ConstructSorting(
        this PageRequest request,
        string sqlQuery,
        IList<string> allowedColumns,
        string? fallbackColumn = null,
        string? fallbackDirection = null,
        bool ensureDeterministicOrder = false
    )
    {
        var builder = new StringBuilder(sqlQuery);

        builder.AppendSorting(request, allowedColumns, fallbackColumn, fallbackDirection, ensureDeterministicOrder);

        return builder.ToString();
    }

    /// <summary>
    /// Constructs SQL LIMIT OFFSET clause for paging.
    /// </summary>
    /// <param name="request">The request criteria.</param>
    /// <param name="sqlQuery">The SQL query to add the LIMIT OFFSET clause to.</param>
    /// <param name="parameters">The DynamicParameters to add parameters to.</param>
    /// <returns>The SQL with LIMIT OFFSET clause.</returns>
    public static string ConstructPaging(this PageRequest request, string sqlQuery, DynamicParameters parameters)
    {
        var builder = new StringBuilder(sqlQuery);
        builder.AppendPaging(request, parameters);
        return builder.ToString();
    }

    /// <summary>
    /// Generate the sql query for getting count of items.
    /// </summary>
    /// <param name="sql">The SQL query.</param>
    /// <returns>The count SQL query.</returns>
    public static string GenerateCountQuery(this string sql)
    {
        var builder = new StringBuilder(sql);
        return builder.WrapWithCountQuery().ToString();
    }

    /// <summary>
    /// Constructs SQL WHERE conditions based on filter models.
    /// </summary>
    /// <param name="filters">Collection of filter models.</param>
    /// <param name="sqlQuery">The SQL query to add the conditions to.</param>
    /// <param name="parameters">The DynamicParameters to add parameters to.</param>
    /// <param name="columnMappings">Optional dictionary to map filter field names to actual database column names.</param>
    /// <returns>The SQL query with the added filter conditions.</returns>
    public static string ConstructFilters(
        this IList<FilterModel> filters,
        string sqlQuery,
        DynamicParameters parameters,
        IDictionary<string, string>? columnMappings = null
    )
    {
        var builder = new StringBuilder(sqlQuery);
        builder.AppendFilters(filters, parameters, columnMappings);
        return builder.ToString();
    }

    /// <summary>
    /// Builds the filter condition for PostgreSQL.
    /// </summary>
    /// <param name="filter">The filter.</param>
    /// <param name="parameterName">Name of the parameter.</param>
    /// <returns>The filter condition.</returns>
    public static string? BuildFilterCondition(FilterModel filter, string parameterName)
    {
        return filter.Comparision switch
        {
            FilterComparison.Equals => $"{filter.FieldName} = {parameterName}",
            FilterComparison.NotEquals => $"{filter.FieldName} <> {parameterName}",
            FilterComparison.GreaterThan => $"{filter.FieldName} > {parameterName}",
            FilterComparison.GreaterThanOrEqual => $"{filter.FieldName} >= {parameterName}",
            FilterComparison.LessThan => $"{filter.FieldName} < {parameterName}",
            FilterComparison.LessThanOrEqual => $"{filter.FieldName} <= {parameterName}",
            FilterComparison.Contains => $"{filter.FieldName} ILIKE '%' || {parameterName} || '%'",
            FilterComparison.NotContains => $"{filter.FieldName} NOT ILIKE '%' || {parameterName} || '%'",
            FilterComparison.StartsWith => $"{filter.FieldName} ILIKE {parameterName} || '%'",
            FilterComparison.EndsWith => $"{filter.FieldName} ILIKE '%' || {parameterName}",
            FilterComparison.IsNull => $"{filter.FieldName} IS NULL",
            FilterComparison.IsNotNull => $"{filter.FieldName} IS NOT NULL",
            FilterComparison.In => $"{filter.FieldName} IN ({parameterName})",
            FilterComparison.NotIn => $"{filter.FieldName} NOT IN ({parameterName})",
            _ => null,
        };
    }

    /// <summary>
    /// Parses a string filter query into a collection of FilterModel objects.
    /// Expected format: "field1:eq:value1,field2:gt:value2,field3:contains:value3".
    /// </summary>
    /// <param name="filterString">The filter string to parse.</param>
    /// <returns>A collection of FilterModel objects.</returns>
    public static IList<FilterModel> ParseFilterString(this string? filterString)
    {
        if (string.IsNullOrWhiteSpace(filterString))
        {
            return [];
        }

        var result = new List<FilterModel>();
        var filterParts = filterString.Split(',', StringSplitOptions.RemoveEmptyEntries);

        foreach (var part in filterParts)
        {
            var segments = part.Split(':', StringSplitOptions.RemoveEmptyEntries);

            if (segments.Length < 3)
            {
                continue;
            }

            var fieldName = segments[0].Trim();

            if (Enum.TryParse<FilterComparison>(segments[1].Trim(), true, out var comparison))
            {
                var fieldValue = segments[2].Trim();
                result.Add(new FilterModel(fieldName, comparison, fieldValue));
            }
        }

        return result;
    }

    /// <summary>
    /// Creates a base SQL builder with the specified query and applies common filters.
    /// </summary>
    /// <param name="request">The page request.</param>
    /// <param name="baseSql">Base SQL query.</param>
    /// <param name="parameters">Parameters collection.</param>
    /// <param name="searchColumns">Columns to search in.</param>
    /// <param name="dateColumnName">Date column name for date range filters.</param>
    /// <returns>StringBuilder with base query and common filters applied.</returns>
    public static StringBuilder CreateFilteredQueryBuilder(
        this PageRequest request,
        string baseSql,
        DynamicParameters parameters,
        IList<string> searchColumns,
        string dateColumnName
    )
    {
        return new StringBuilder(baseSql).ApplyStandardFilters(request, searchColumns, dateColumnName, parameters);
    }

    #endregion
}
