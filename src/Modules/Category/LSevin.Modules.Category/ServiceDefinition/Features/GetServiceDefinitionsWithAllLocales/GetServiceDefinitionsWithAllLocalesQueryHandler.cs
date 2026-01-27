using System.Text;
using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionsWithAllLocales;

internal sealed class GetServiceDefinitionsWithAllLocalesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceDefinitionsWithAllLocalesQuery, IPageList<GetServiceDefinitionsWithAllLocalesResponse>>
{
    private static readonly List<string> _searchColumns = ["sd.name_translations", "sd.description_translations"];
    private const string FallbackSortColumn = "sd.name_translations";

    public async Task<Result<IPageList<GetServiceDefinitionsWithAllLocalesResponse>>> Handle(
        GetServiceDefinitionsWithAllLocalesQuery request,
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
            return PageList<GetServiceDefinitionsWithAllLocalesResponse>.Empty;
        }

        // Data Query
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(request, new List<string>(), FallbackSortColumn, ensureDeterministicOrder: true);

        dataQueryBuilder.AppendPaging(request, parameters);

        var rows = await connection.QueryAsync<ServiceDefinitionRowDto>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        var serviceDefinitions = rows.Select(row =>
            {
                var nameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.NameTranslations ?? "{}"
                );
                var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.DescriptionTranslations ?? "{}"
                );

                return new GetServiceDefinitionsWithAllLocalesResponse(
                    row.Id,
                    LocalizedContentResponseDto.FromTranslations(nameTranslations ?? new()),
                    LocalizedContentResponseDto.FromTranslations(descriptionTranslations ?? new()),
                    row.CategoryId,
                    row.CategoryName,
                    row.DurationMinutes,
                    row.BasePrice,
                    row.Currency,
                    row.PricingModel,
                    row.IsActive
                );
            })
            .ToList();

        return PageList<GetServiceDefinitionsWithAllLocalesResponse>.Create(
            serviceDefinitions,
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
                sd.id AS {nameof(ServiceDefinitionRowDto.Id)},
                sd.name_translations AS {nameof(ServiceDefinitionRowDto.NameTranslations)},
                sd.description_translations AS {nameof(ServiceDefinitionRowDto.DescriptionTranslations)},
                c.id AS {nameof(ServiceDefinitionRowDto.CategoryId)},
                COALESCE(
                    c.name_translations ->> '{currentLocale}',
                    c.name_translations ->> '{defaultLocale}',
                    (c.name_translations ->> (SELECT jsonb_object_keys(c.name_translations) LIMIT 1))
                ) AS {nameof(ServiceDefinitionRowDto.CategoryName)},
                sd.duration_minutes AS {nameof(ServiceDefinitionRowDto.DurationMinutes)},
                sd.value AS {nameof(ServiceDefinitionRowDto.BasePrice)},
                sd.currency AS {nameof(ServiceDefinitionRowDto.Currency)},
                sd.pricing_model AS {nameof(ServiceDefinitionRowDto.PricingModel)},
                sd.is_active AS {nameof(ServiceDefinitionRowDto.IsActive)}
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
        GetServiceDefinitionsWithAllLocalesQuery request,
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

// Internal DTO for Dapper mapping
internal sealed record ServiceDefinitionRowDto(
    Guid Id,
    string NameTranslations,
    string DescriptionTranslations,
    Guid CategoryId,
    string CategoryName,
    int DurationMinutes,
    decimal BasePrice,
    string Currency,
    string PricingModel,
    bool IsActive
);
