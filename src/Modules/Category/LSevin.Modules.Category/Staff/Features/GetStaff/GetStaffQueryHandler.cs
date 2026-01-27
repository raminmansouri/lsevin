using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.Staff.Features.GetStaff;

internal sealed class GetStaffQueryHandler(IDbConnectionFactory dbConnectionFactory, ILocaleAccessor localeAccessor)
    : IQueryHandler<GetStaffQuery, IPageList<GetStaffResponse>>
{
    private static readonly List<string> _searchColumns =
    [
        "s.name_translations",
        "s.biography_translations",
        "s.title_translations",
    ];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetStaffResponse.Name),
        nameof(GetStaffResponse.Title),
        nameof(GetStaffResponse.IsActive),
        nameof(GetStaffResponse.CreateDate),
    ];

    public async Task<Result<IPageList<GetStaffResponse>>> Handle(
        GetStaffQuery request,
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
        var countSql = $"SELECT COUNT(s.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetStaffResponse>.Empty;
        }

        // Data Query
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(request, _allowedSortColumns, "s.id", ensureDeterministicOrder: true);

        dataQueryBuilder.AppendPaging(request, parameters);

        var staff = await connection.QueryAsync<GetStaffResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        return PageList<GetStaffResponse>.Create(
            staff.AsList(),
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
                s.id AS {nameof(GetStaffResponse.Id)},
                COALESCE(
                    s.name_translations ->> '{currentLocale}',
                    s.name_translations ->> '{defaultLocale}',
                    (s.name_translations ->> (SELECT jsonb_object_keys(s.name_translations) LIMIT 1))
                ) AS {nameof(GetStaffResponse.Name)},
                COALESCE(
                    s.biography_translations ->> '{currentLocale}',
                    s.biography_translations ->> '{defaultLocale}',
                    (s.biography_translations ->> (SELECT jsonb_object_keys(s.biography_translations) LIMIT 1))
                ) AS {nameof(GetStaffResponse.Biography)},
                COALESCE(
                    s.title_translations ->> '{currentLocale}',
                    s.title_translations ->> '{defaultLocale}',
                    (s.title_translations ->> (SELECT jsonb_object_keys(s.title_translations) LIMIT 1))
                ) AS {nameof(GetStaffResponse.Title)},
                s.profile_image_url AS {nameof(GetStaffResponse.ProfileImageUrl)},
                s.is_active AS {nameof(GetStaffResponse.IsActive)},
                (SELECT COUNT(*)::int FROM category.staff_services WHERE staff_id = s.id) AS {nameof(
                GetStaffResponse.ServiceCount
            )},
                s.create_date AS {nameof(GetStaffResponse.CreateDate)},
                s.last_modified_date AS {nameof(GetStaffResponse.LastModifiedDate)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.staff s
            """
        );
    }

    private static void ApplyFilters(StringBuilder baseFromBuilder, GetStaffQuery request, DynamicParameters parameters)
    {
        // Filter by active status if specified
        if (request.IsActive.HasValue)
        {
            baseFromBuilder.AppendWhereOrAnd("s.is_active = @IsActive");
            parameters.Add("IsActive", request.IsActive.Value);
        }

        // Apply text search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            var filterModels = request.GetFilterModels();
            if (!filterModels.Any() && !request.Filters.Contains(':', StringComparison.Ordinal))
            {
                // Simple text search across all search columns
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
                // Advanced filtering with column mappings
                var columnMappings = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    { nameof(GetStaffResponse.Name), "s.name_translations" },
                    { nameof(GetStaffResponse.Biography), "s.biography_translations" },
                    { nameof(GetStaffResponse.Title), "s.title_translations" },
                    { nameof(GetStaffResponse.IsActive), "s.is_active" },
                    { nameof(GetStaffResponse.CreateDate), "s.create_date" },
                    { nameof(GetStaffResponse.LastModifiedDate), "s.last_modified_date" },
                };
                baseFromBuilder.AppendFilters(filterModels, parameters, columnMappings);
            }
        }
    }
}
