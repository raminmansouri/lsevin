using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsPagedAdmin;

internal sealed class GetServiceProviderRequestsPagedAdminQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceProviderRequestsPagedAdminQuery, IPageList<GetServiceProviderRequestsPagedAdminResponse>>
{
    private static readonly List<string> _searchColumns =
    [
        "sp.name_translations",
        "spr.customer_full_name",
        "spr.customer_email",
        "spr.message",
    ];

    private static readonly List<string> _allowedSortColumns =
    [
        "spr.customer_full_name",
        "spr.customer_email",
        "spr.message",
        "rs.name",
        "spr.create_date",
        "spr.id",
    ];
    private const string FallbackSortColumn = "spr.id";

    public async Task<Result<IPageList<GetServiceProviderRequestsPagedAdminResponse>>> Handle(
        GetServiceProviderRequestsPagedAdminQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        // Build base FROM
        var baseFrom = BuildBaseFromClause();

        // Apply text/advanced filters
        ApplyFilters(baseFrom, request, parameters);

        // Count
        var countSql = $"SELECT COUNT(spr.id) {baseFrom}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetServiceProviderRequestsPagedAdminResponse>.Empty;
        }

        // Data query builder
        var dataBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFrom}");
        dataBuilder.AppendSorting(request, _allowedSortColumns, FallbackSortColumn, ensureDeterministicOrder: true);
        dataBuilder.AppendPaging(request, parameters);

        var items = await connection.QueryAsync<GetServiceProviderRequestsPagedAdminResponse>(
            new CommandDefinition(dataBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        return PageList<GetServiceProviderRequestsPagedAdminResponse>.Create(
            items.AsList(),
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
                spr.id AS {nameof(GetServiceProviderRequestsPagedAdminResponse.Id)},
                spr.service_provider_id AS {nameof(GetServiceProviderRequestsPagedAdminResponse.ServiceProviderId)},
                COALESCE(
                    sp.name_translations ->> '{currentLocale}',
                    sp.name_translations ->> '{defaultLocale}',
                    (sp.name_translations ->> (SELECT jsonb_object_keys(sp.name_translations) LIMIT 1))
                ) AS {nameof(GetServiceProviderRequestsPagedAdminResponse.ServiceProviderName)},
                spr.customer_id AS {nameof(GetServiceProviderRequestsPagedAdminResponse.CustomerId)},
                spr.customer_full_name AS {nameof(GetServiceProviderRequestsPagedAdminResponse.CustomerFullName)},
                spr.customer_email AS {nameof(GetServiceProviderRequestsPagedAdminResponse.CustomerEmail)},
                spr.message AS {nameof(GetServiceProviderRequestsPagedAdminResponse.Message)},
                rs.name AS {nameof(GetServiceProviderRequestsPagedAdminResponse.Status)},
                spr.create_date AS {nameof(GetServiceProviderRequestsPagedAdminResponse.CreateDate)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.service_provider_requests spr
            INNER JOIN category.service_providers sp ON spr.service_provider_id = sp.id
            INNER JOIN category.service_provider_request_statuses rs ON rs.id = spr.request_status_id
            """
        );
    }

    private static void ApplyFilters(
        StringBuilder builder,
        GetServiceProviderRequestsPagedAdminQuery request,
        DynamicParameters parameters
    )
    {
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            var filterModels = request.GetFilterModels();
            if (!filterModels.Any() && !request.Filters.Contains(':', StringComparison.Ordinal))
            {
                builder.AppendSearchFilter(request.Filters, _searchColumns, parameters, paramName: "Search");
            }
            else if (filterModels.Any())
            {
                // example column mappings if needed in future
                // var columnMappings = new Dictionary<string, string>(StringComparer.Ordinal) {
                //     { nameof(GetServiceProviderRequestsPagedAdminResponse.ServiceProviderName), "sp.name" },
                //     { nameof(GetServiceProviderRequestsPagedAdminResponse.CustomerFullName), "spr.customer_full_name" },
                //     { nameof(GetServiceProviderRequestsPagedAdminResponse.CustomerEmail), "spr.customer_email" },
                //     { nameof(GetServiceProviderRequestsPagedAdminResponse.Message), "spr.message" },
                //     { nameof(GetServiceProviderRequestsPagedAdminResponse.Status), "rs.name" },
                // };
                // builder.AppendFilters(filterModels, parameters, columnMappings);
            }
        }
    }
}
