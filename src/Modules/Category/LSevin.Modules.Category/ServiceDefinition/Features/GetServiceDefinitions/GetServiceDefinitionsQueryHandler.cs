using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitions;

internal sealed class GetServiceDefinitionsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceDefinitionsQuery, IPageList<GetServiceDefinitionsResponse>>
{
    private static readonly List<string> _searchColumns = ["sd.name_translations", "sd.description_translations"];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetServiceDefinitionsResponse.Name),
        nameof(GetServiceDefinitionsResponse.CategoryName),
        nameof(GetServiceDefinitionsResponse.DurationMinutes),
        nameof(GetServiceDefinitionsResponse.BasePrice),
        nameof(GetServiceDefinitionsResponse.IsActive),
    ];
    private const string FallbackSortColumn = "sd.name_translations";

    public async Task<Result<IPageList<GetServiceDefinitionsResponse>>> Handle(
        GetServiceDefinitionsQuery request,
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
        var countSql = $"SELECT COUNT(sd.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetServiceDefinitionsResponse>.Empty;
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

        var serviceDefinitions = await connection.QueryAsync<GetServiceDefinitionsResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        return PageList<GetServiceDefinitionsResponse>.Create(
            serviceDefinitions.AsList(),
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
                sd.id AS {nameof(GetServiceDefinitionsResponse.Id)},
                COALESCE(
                    sd.name_translations ->> '{currentLocale}',
                    sd.name_translations ->> '{defaultLocale}',
                    (sd.name_translations ->> (SELECT jsonb_object_keys(sd.name_translations) LIMIT 1))
                ) AS {nameof(GetServiceDefinitionsResponse.Name)},
                COALESCE(
                    sd.description_translations ->> '{currentLocale}',
                    sd.description_translations ->> '{defaultLocale}',
                    (sd.description_translations ->> (SELECT jsonb_object_keys(sd.description_translations) LIMIT 1))
                ) AS {nameof(GetServiceDefinitionsResponse.Description)},
                c.id AS {nameof(GetServiceDefinitionsResponse.CategoryId)},
                COALESCE(
                    c.name_translations ->> '{currentLocale}',
                    c.name_translations ->> '{defaultLocale}',
                    (c.name_translations ->> (SELECT jsonb_object_keys(c.name_translations) LIMIT 1))
                ) AS {nameof(GetServiceDefinitionsResponse.CategoryName)},
                sd.duration_minutes AS {nameof(GetServiceDefinitionsResponse.DurationMinutes)},
                sd.value AS {nameof(GetServiceDefinitionsResponse.BasePrice)},
                sd.currency AS {nameof(GetServiceDefinitionsResponse.Currency)},
                sd.pricing_model AS {nameof(GetServiceDefinitionsResponse.PricingModel)},
                sd.is_active AS {nameof(GetServiceDefinitionsResponse.IsActive)},
                (SELECT COUNT(*)::int FROM category.service_attribute_definitions sad
                 WHERE sad.service_definition_id = sd.id) AS {nameof(GetServiceDefinitionsResponse.AttributeCount)},
                (SELECT COUNT(*)::int FROM category.service_definition_domain_requirements sdr
                 WHERE sdr.service_definition_id = sd.id) AS {nameof(GetServiceDefinitionsResponse.RequirementCount)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.service_definitions sd
            INNER JOIN category.categories c ON sd.category_id = c.id
            """
        );
    }

    private static void ApplyFilters(
        StringBuilder baseFromBuilder,
        GetServiceDefinitionsQuery request,
        DynamicParameters parameters
    )
    {
        // Filter by active status if specified
        if (request.IsActive.HasValue)
        {
            baseFromBuilder.AppendWhereOrAnd("sd.is_active = @IsActive");
            parameters.Add("IsActive", request.IsActive.Value);
        }

        // Filter by category if specified
        if (request.CategoryId.HasValue && request.CategoryId != Guid.Empty)
        {
            baseFromBuilder.AppendWhereOrAnd("sd.category_id = @CategoryId");
            parameters.Add("CategoryId", request.CategoryId.Value);
        }

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            baseFromBuilder.AppendSearchFilter(request.Filters, _searchColumns, parameters, isJsonbColumn: true);
        }

        // Apply date range filters if provided
        if (request.StartDate.HasValue || request.EndDate.HasValue)
        {
            baseFromBuilder.AppendDateRange(request.StartDate, request.EndDate, "sd.create_date", parameters);
        }
    }
}
