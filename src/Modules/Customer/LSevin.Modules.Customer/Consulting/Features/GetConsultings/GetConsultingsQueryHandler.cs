using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using Dapper;

namespace LSevin.Modules.Customer.Consulting.Features.GetConsultings;

internal sealed class GetConsultingsQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetConsultingsQuery, IPageList<GetConsultingsResponse>>
{
    private static readonly List<string> _searchColumns =
    [
        "cu.first_name",
        "cu.last_name",
        "cu.email",
        "c.description",
        "c.category_name",
    ];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetConsultingsResponse.CustomerName),
        nameof(GetConsultingsResponse.CustomerEmail),
        nameof(GetConsultingsResponse.Description),
        nameof(GetConsultingsResponse.CategoryName),
    ];
    private const string FallbackSortColumn = "c.id";

    public async Task<Result<IPageList<GetConsultingsResponse>>> Handle(
        GetConsultingsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        // Build the base FROM ... JOIN clauses
        var baseFromBuilder = BuildBaseFromClause();

        // Apply filters (search, advanced) to the base builder
        ApplyFilters(baseFromBuilder, request, parameters);

        // --- Count Query ---
        // Clone parameters as the count query might add different ones than paging/sorting later
        var countParameters = new DynamicParameters(parameters);
        var countSql = $"SELECT COUNT(c.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetConsultingsResponse>.Empty;
        }

        // --- Data Query ---
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(
            request,
            _allowedSortColumns,
            FallbackSortColumn,
            ensureDeterministicOrder: true
        );

        dataQueryBuilder.AppendPaging(request, parameters); // Use original parameters instance

        // Execute the data query
        var consultings = await connection.QueryAsync<GetConsultingsResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        // Return the paged result
        return PageList<GetConsultingsResponse>.Create(
            consultings.AsList(),
            request.PageNumber,
            request.PageSize,
            totalItems: totalCount
        );
    }

    private static string GetSelectClause() =>
        $"""
                c.id AS {nameof(GetConsultingsResponse.ConsultingId)},
                cu.id AS {nameof(GetConsultingsResponse.CustomerId)},
                cu.first_name || ' ' || cu.last_name AS {nameof(GetConsultingsResponse.CustomerName)},
                cu.email AS {nameof(GetConsultingsResponse.CustomerEmail)},
                c.description AS {nameof(GetConsultingsResponse.Description)},
                c.category_id AS {nameof(GetConsultingsResponse.CategoryId)},
                c.category_name AS {nameof(GetConsultingsResponse.CategoryName)}
            """;

    private static StringBuilder BuildBaseFromClause()
    {
        // Intentionally doesn't start with SELECT
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM customer.consultings c
            INNER JOIN customer.customers cu ON c.customer_id = cu.id
            """
        );
    }

    private static void ApplyFilters(StringBuilder builder, GetConsultingsQuery request, DynamicParameters parameters)
    {
        // Apply simple text search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            // Assuming request.Filters without ':' is a simple search term
            // Note: This logic might need refinement based on how FilterModels are intended to be used alongside simple search
            var filterModels = request.GetFilterModels();
            if (!filterModels.Any() && !request.Filters.Contains(':', StringComparison.Ordinal))
            {
                builder.AppendSearchFilter(request.Filters, _searchColumns, parameters, paramName: "SearchTerm");
            }
            else if (filterModels.Any())
            {
                // -- Advanced Filtering Placeholder --
                // Define column mappings for filters if needed
                // var columnMappings = new Dictionary<string, string>(StringComparer.Ordinal)
                // {
                //     {"CustomerName", "cu.first_name || ' ' || cu.last_name"},
                //     {"CustomerEmail", "cu.email"},
                //     {"Description", "c.description"},
                //     {"ConsultingReason", "cr.name"},
                //     {"ConsultingReasonId", "c.consulting_reason_id"},
                // };
                // builder.AppendFilters(filterModels, parameters, columnMappings);
            }
        }

        // Add other potential filters here using builder.AppendWhereOrAnd(...)
    }
}

// Old implementation kept for reference
// internal sealed class GetConsultingsQueryHandler(IDbConnectionFactory dbConnectionFactory)
//     : IQueryHandler<GetConsultingsQuery, IPageList<GetConsultingsResponse>>
// {
//     public async Task<Result<IPageList<GetConsultingsResponse>>> Handle(
//         GetConsultingsQuery request,
//         CancellationToken cancellationToken
//     )
//     {
//         Guard.Against.Null(request, nameof(request));
//
//         await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
//
//         var parameters = new DynamicParameters();
//
//         var sqlQuery = $"""
//             SELECT
//                 c.id AS {nameof(GetConsultingsResponse.ConsultingId)},
//                 cu.id AS {nameof(GetConsultingsResponse.CustomerId)},
//                 cu.first_name || ' ' || cu.last_name AS {nameof(GetConsultingsResponse.CustomerName)},
//                 cu.email AS {nameof(GetConsultingsResponse.CustomerEmail)},
//                 c.description AS {nameof(GetConsultingsResponse.Description)},
//                 cr.name AS {nameof(GetConsultingsResponse.ConsultingReason)}
//             FROM customer.consultings c
//             INNER JOIN customer.customers cu ON c.customer_id = cu.id
//             INNER JOIN customer.consulting_reasons cr ON c.consulting_reason_id = cr.id
//             """;
//
//         // Apply advanced filters if specified
//         // var filters = request.GetFilterModels();
//         // if (!filters.Any() && !string.IsNullOrWhiteSpace(request.Filters))
//         // {
//         List<string> searchColumns = ["cu.first_name", "cu.last_name", "cu.email", "c.description", "cr.name"];
//         sqlQuery = request.ConstructSearch(sqlQuery, parameters, searchColumns);
//         // }
//         // else
//         // {
//         //     // Define column mappings for filters
//         //     var columnMappings = new Dictionary<string, string>(StringComparer.Ordinal)
//         //     {
//         //         {"CustomerName", "cu.first_name || ' ' || cu.last_name"},
//         //         {"CustomerEmail", "cu.email"},
//         //         {"Description", "c.description"},
//         //         {"ConsultingReason", "cr.name"},
//         //         {"ConsultingReasonId", "c.consulting_reason_id"},
//         //     };
//         //     sqlQuery = filters.ConstructFilters(sqlQuery, parameters, columnMappings);
//         // }
//
//         List<string> allowedSortColumns =
//         [
//             nameof(GetConsultingsResponse.CustomerName),
//             nameof(GetConsultingsResponse.CustomerEmail),
//             nameof(GetConsultingsResponse.Description),
//             nameof(GetConsultingsResponse.ConsultingReason),
//         ];
//
//         // Apply sorting
//         sqlQuery = request.ConstructSorting(sqlQuery, allowedSortColumns);
//
//         // Get total count before applying paging
//         var countSql = sqlQuery.GenerateCountQuery();
//         var totalCount = await connection.ExecuteScalarAsync<int>(
//             new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken)
//         );
//
//         // Apply paging
//         sqlQuery = request.ConstructPaging(sqlQuery, parameters);
//
//         // Execute the query
//         var consultings = await connection.QueryAsync<GetConsultingsResponse>(
//             new CommandDefinition(sqlQuery, parameters, cancellationToken: cancellationToken)
//         );
//
//         // Return the paged result
//         return PageList<GetConsultingsResponse>.Create(
//             consultings.AsList(),
//             request.PageNumber,
//             request.PageSize,
//             totalItems: totalCount
//         );
//     }
// }
// ... existing code ...
