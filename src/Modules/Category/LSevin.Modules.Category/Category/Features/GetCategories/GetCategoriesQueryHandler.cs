using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.Category.Features.GetCategories;

internal sealed class GetCategoriesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetCategoriesQuery, IPageList<GetCategoriesResponse>>
{
    private static readonly List<string> _searchColumns =
    [
        "c.name_translations",
        "c.description_translations",
        "p.name_translations",
    ];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetCategoriesResponse.Name),
        nameof(GetCategoriesResponse.Description),
        nameof(GetCategoriesResponse.ParentName),
        nameof(GetCategoriesResponse.DisplayOrder),
        nameof(GetCategoriesResponse.IsActive),
        nameof(GetCategoriesResponse.CreateDate),
    ];

    private const string FallbackSortColumn = "c.display_order";

    public async Task<Result<IPageList<GetCategoriesResponse>>> Handle(
        GetCategoriesQuery request,
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
        var countParameters = new DynamicParameters(parameters);
        var countSql = $"SELECT COUNT(c.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetCategoriesResponse>.Empty;
        }

        // --- Data Query ---
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(
            request,
            _allowedSortColumns,
            FallbackSortColumn,
            ensureDeterministicOrder: true
        );

        dataQueryBuilder.AppendPaging(request, parameters);

        // Execute the data query
        var categories = await connection.QueryAsync<GetCategoriesResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        // Return the paged result
        return PageList<GetCategoriesResponse>.Create(
            categories.AsList(),
            request.PageNumber,
            request.PageSize,
            totalItems: totalCount
        );
    }

    private string GetSelectClause()
    {
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        return $"""
                c.id AS {nameof(GetCategoriesResponse.CategoryId)},
                COALESCE(
                    c.name_translations ->> '{currentLocale}',
                    c.name_translations ->> '{defaultLocale}',
                    (c.name_translations ->> (SELECT jsonb_object_keys(c.name_translations) LIMIT 1))
                ) AS {nameof(GetCategoriesResponse.Name)},
                COALESCE(
                    c.description_translations ->> '{currentLocale}',
                    c.description_translations ->> '{defaultLocale}',
                    (c.description_translations ->> (SELECT jsonb_object_keys(c.description_translations) LIMIT 1))
                ) AS {nameof(GetCategoriesResponse.Description)},
                c.parent_id AS {nameof(GetCategoriesResponse.ParentId)},
                COALESCE(
                    p.name_translations ->> '{currentLocale}',
                    p.name_translations ->> '{defaultLocale}',
                    (p.name_translations ->> (SELECT jsonb_object_keys(p.name_translations) LIMIT 1))
                ) AS {nameof(GetCategoriesResponse.ParentName)},
                c.display_order AS {nameof(GetCategoriesResponse.DisplayOrder)},
                c.is_active AS {nameof(GetCategoriesResponse.IsActive)},
                c.icon_url AS {nameof(GetCategoriesResponse.IconUrl)},
                c.create_date AS {nameof(GetCategoriesResponse.CreateDate)},
                c.last_modified_date AS {nameof(GetCategoriesResponse.LastModifiedDate)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.categories c
            LEFT JOIN category.categories p ON c.parent_id = p.id
            """
        );
    }

    private static void ApplyFilters(StringBuilder builder, GetCategoriesQuery request, DynamicParameters parameters)
    {
        // Apply simple text search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            var filterModels = request.GetFilterModels();
            if (!filterModels.Any() && !request.Filters.Contains(':', StringComparison.Ordinal))
            {
                builder.AppendSearchFilter(
                    request.Filters,
                    _searchColumns,
                    parameters,
                    paramName: "SearchTerm",
                    isJsonbColumn: true
                );
            }
            else if (filterModels.Any())
            {
                var columnMappings = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    { nameof(GetCategoriesResponse.Name), "c.name_translations" },
                    { nameof(GetCategoriesResponse.Description), "c.description_translations" },
                    { nameof(GetCategoriesResponse.ParentName), "p.name_translations" },
                    { nameof(GetCategoriesResponse.DisplayOrder), "c.display_order" },
                    { nameof(GetCategoriesResponse.IsActive), "c.is_active" },
                    { nameof(GetCategoriesResponse.ParentId), "c.parent_id" },
                };
                builder.AppendFilters(filterModels, parameters, columnMappings);
            }
        }

        // Optional: Add additional filters for specific use cases
        // For example, filter by parent ID if needed
        // if (request.ParentId.HasValue)
        // {
        //     parameters.Add("ParentId", request.ParentId.Value);
        //     builder.AppendWhereOrAnd("c.ParentId = @ParentId");
        // }
    }
}
