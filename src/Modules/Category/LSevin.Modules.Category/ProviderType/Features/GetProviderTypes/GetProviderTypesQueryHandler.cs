using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypes;

internal sealed class GetProviderTypesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetProviderTypesQuery, IPageList<GetProviderTypesResponse>>
{
    private static readonly List<string> _searchColumns = ["pt.name_translations", "pt.description_translations"];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetProviderTypesResponse.Name),
        nameof(GetProviderTypesResponse.Description),
        nameof(GetProviderTypesResponse.IsActive),
        nameof(GetProviderTypesResponse.AttributeDefinitionsCount),
        nameof(GetProviderTypesResponse.CreateDate),
    ];
    private const string FallbackSortColumn = "pt.name_translations";

    public async Task<Result<IPageList<GetProviderTypesResponse>>> Handle(
        GetProviderTypesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        var baseFromBuilder = BuildBaseFromClause();
        ApplyFilters(baseFromBuilder, request, parameters);

        // Count Query
        var countParameters = new DynamicParameters(parameters);
        var countSql = $"SELECT COUNT(pt.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetProviderTypesResponse>.Empty;
        }

        // Data Query
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(
            request,
            _allowedSortColumns,
            FallbackSortColumn,
            ensureDeterministicOrder: true
        );

        dataQueryBuilder.AppendPaging(request, parameters);

        var providerTypes = await connection.QueryAsync<GetProviderTypesResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        return PageList<GetProviderTypesResponse>.Create(
            providerTypes.AsList(),
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
                pt.id AS {nameof(GetProviderTypesResponse.Id)},
                COALESCE(
                    pt.name_translations ->> '{currentLocale}',
                    pt.name_translations ->> '{defaultLocale}',
                    (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
                ) AS {nameof(GetProviderTypesResponse.Name)},
                COALESCE(
                    pt.description_translations ->> '{currentLocale}',
                    pt.description_translations ->> '{defaultLocale}',
                    (pt.description_translations ->> (SELECT jsonb_object_keys(pt.description_translations) LIMIT 1))
                ) AS {nameof(GetProviderTypesResponse.Description)},
                pt.is_active AS {nameof(GetProviderTypesResponse.IsActive)},
                pt.icon_url AS {nameof(GetProviderTypesResponse.IconUrl)},
                (SELECT COUNT(*)::int FROM category.provider_attribute_definitions pad
                 WHERE pad.provider_type_id = pt.id) AS {nameof(GetProviderTypesResponse.AttributeDefinitionsCount)},
                pt.create_date AS {nameof(GetProviderTypesResponse.CreateDate)},
                pt.last_modified_date AS {nameof(GetProviderTypesResponse.LastModifiedDate)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.provider_types pt
            """
        );
    }

    private static void ApplyFilters(
        StringBuilder baseFromBuilder,
        GetProviderTypesQuery request,
        DynamicParameters parameters
    )
    {
        var whereConditions = new List<string>();

        // Filter by active status if specified
        if (request.IsActive.HasValue)
        {
            whereConditions.Add("pt.is_active = @IsActive");
            parameters.Add("IsActive", request.IsActive.Value);
        }

        // Apply simple text search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            var filterModels = request.GetFilterModels();
            if (!filterModels.Any() && !request.Filters.Contains(':', StringComparison.Ordinal))
            {
                baseFromBuilder.AppendSearchFilter(
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
                    { nameof(GetProviderTypesResponse.Name), "pt.name_translations" },
                    { nameof(GetProviderTypesResponse.Description), "pt.description_translations" },
                    { nameof(GetProviderTypesResponse.IsActive), "pt.is_active" },
                };
                baseFromBuilder.AppendFilters(filterModels, parameters, columnMappings);
            }
        }
        else if (whereConditions.Count > 0)
        {
            // Apply WHERE clause if there are any conditions
            baseFromBuilder.Append(" WHERE ");
            baseFromBuilder.Append(string.Join(" AND ", whereConditions));
        }
    }
}
