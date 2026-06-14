using System.Data;
using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersByProviderType;

internal sealed class GetServiceProvidersByProviderTypeQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceProvidersByProviderTypeQuery, IPageList<GetServiceProvidersByProviderTypeResponse>>
{
    private static readonly List<string> _searchColumns = ["sp.name_translations", "sp.description_translations"];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetServiceProvidersByProviderTypeResponse.Name),
        nameof(GetServiceProvidersByProviderTypeResponse.Grade),
        nameof(GetServiceProvidersByProviderTypeResponse.MinimumServicePrice),
    ];

    public async Task<Result<IPageList<GetServiceProvidersByProviderTypeResponse>>> Handle(
        GetServiceProvidersByProviderTypeQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        // Check if the provider type exists
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        parameters.Add("ProviderTypeId", request.ProviderTypeId);

        var providerTypeExists = await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                "SELECT EXISTS(SELECT 1 FROM category.provider_types WHERE id = @ProviderTypeId)",
                parameters,
                cancellationToken: cancellationToken
            )
        );

        if (!providerTypeExists)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);
        }

        var baseFromBuilder = BuildBaseFromClause();
        ApplyFilters(baseFromBuilder, request, parameters);

        // Count Query
        var countParameters = new DynamicParameters(parameters);
        var countSql = $"SELECT COUNT(sp.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetServiceProvidersByProviderTypeResponse>.Empty;
        }

        // Data Query
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(request, _allowedSortColumns, "sp.id", ensureDeterministicOrder: true);

        dataQueryBuilder.AppendPaging(request, parameters);

        var serviceProviders = await connection.QueryAsync<ServiceProviderRowDto>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );

        var serviceProvidersList = serviceProviders.AsList();

        if (serviceProvidersList.Count == 0)
        {
            return PageList<GetServiceProvidersByProviderTypeResponse>.Empty;
        }

        // Get attributes for all service providers in one query
        var providerIds = serviceProvidersList.Select(sp => sp.Id).ToArray();
        var attributes = await GetServiceProviderAttributes(connection, providerIds, cancellationToken);

        // Group attributes by service provider
        var attributesByProvider = attributes
            .GroupBy(a => a.ServiceProviderId)
            .ToDictionary(
                g => g.Key,
                g => g.Take(3).Select(a => new ServiceProviderAttributeItemDto(a.Id, a.AttributeName, a.Value)).ToList()
            );

        // Build final response with attributes
        var results = serviceProvidersList.ConvertAll(sp => new GetServiceProvidersByProviderTypeResponse(
            sp.Id,
            sp.Name,
            sp.MinimumServicePrice,
            sp.Currency,
            sp.ThumbnailUrl,
            sp.Grade,
            attributesByProvider.GetValueOrDefault(sp.Id, [])
        ));

        return PageList<GetServiceProvidersByProviderTypeResponse>.Create(
            results,
            request.PageNumber,
            request.PageSize,
            totalItems: totalCount
        );
    }

    private async Task<List<ServiceProviderAttributeDto>> GetServiceProviderAttributes(
        IDbConnection connection,
        Guid[] providerIds,
        CancellationToken cancellationToken
    )
    {
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var attributesSql =
            $@"
            SELECT
                pa.service_provider_id AS ServiceProviderId,
                pa.id AS Id,
                COALESCE(
                    pad.name_translations ->> '{currentLocale}',
                    pad.name_translations ->> '{defaultLocale}',
                    (pad.name_translations ->> (SELECT jsonb_object_keys(pad.name_translations) LIMIT 1))
                ) AS AttributeName,
                COALESCE(
                    pa.value_translations ->> '{currentLocale}',
                    pa.value_translations ->> '{defaultLocale}',
                    (pa.value_translations ->> (SELECT jsonb_object_keys(pa.value_translations) LIMIT 1))
                ) AS Value
            FROM category.provider_attributes pa
            JOIN category.provider_attribute_definitions pad ON pa.attribute_definition_id = pad.id
            WHERE pa.service_provider_id = ANY(@ProviderIds)";

        var attributes = await connection.QueryAsync<ServiceProviderAttributeDto>(
            new CommandDefinition(
                attributesSql,
                new { ProviderIds = providerIds },
                cancellationToken: cancellationToken
            )
        );

        return attributes.AsList();
    }

    private string GetSelectClause()
    {
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        return $"""
                sp.id AS {nameof(ServiceProviderRowDto.Id)},
                COALESCE(
                    sp.name_translations ->> '{currentLocale}',
                    sp.name_translations ->> '{defaultLocale}',
                    (sp.name_translations ->> (SELECT jsonb_object_keys(sp.name_translations) LIMIT 1))
                ) AS {nameof(ServiceProviderRowDto.Name)},
                (
                    SELECT MIN(ps.value)
                    FROM category.provider_services ps
                    WHERE ps.service_provider_id = sp.id
                ) AS {nameof(ServiceProviderRowDto.MinimumServicePrice)},
                (
                    SELECT ps.currency
                    FROM category.provider_services ps
                    WHERE ps.service_provider_id = sp.id
                    ORDER BY ps.value ASC
                    LIMIT 1
                ) AS {nameof(ServiceProviderRowDto.Currency)},
                (
                    SELECT pgi.url
                    FROM category.provider_gallery_items pgi
                    WHERE pgi.service_provider_id = sp.id
                    ORDER BY pgi.display_order ASC
                    LIMIT 1
                ) AS {nameof(ServiceProviderRowDto.ThumbnailUrl)},
                spg.name AS {nameof(ServiceProviderRowDto.Grade)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.service_providers sp
            LEFT JOIN category.service_provider_grades spg ON sp.grade_id = spg.id
            WHERE sp.provider_type_id = @ProviderTypeId
            """
        );
    }

    private sealed class ServiceProviderRowDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = null!;
        public decimal? MinimumServicePrice { get; init; }
        public string? Currency { get; init; }
        public string? ThumbnailUrl { get; init; }
        public string Grade { get; init; } = null!;
    }

    private sealed class ServiceProviderAttributeDto
    {
        public Guid ServiceProviderId { get; init; }
        public Guid Id { get; init; }
        public string AttributeName { get; init; } = null!;
        public string Value { get; init; } = null!;
    }

    private void ApplyFilters(
        StringBuilder baseFromBuilder,
        GetServiceProvidersByProviderTypeQuery request,
        DynamicParameters parameters
    )
    {
        // Always filter for active providers in public endpoint
        baseFromBuilder.Append(" AND sp.is_active = true");

        // Filter by country code if specified
        if (!string.IsNullOrWhiteSpace(request.CountryCode))
        {
            baseFromBuilder.Append(" AND sp.country = @CountryCode");
            parameters.Add("CountryCode", request.CountryCode);
        }

        // Filter by city code if specified
        if (!string.IsNullOrWhiteSpace(request.CityCode))
        {
            baseFromBuilder.Append(" AND sp.city = @CityCode");
            parameters.Add("CityCode", request.CityCode);
        }

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            baseFromBuilder.AppendSearchFilter(request.Filters, _searchColumns, parameters, isJsonbColumn: true);
        }

        // Apply attribute filters if provided
        if (request.AttributeFilters != null && request.AttributeFilters.Length > 0)
        {
            var currentLocale = localeAccessor.CurrentLocale;
            var defaultLocale = localeAccessor.DefaultLocale;

            // Parse attribute filters from "guid:value" format
            var parsedFilters = new List<ProviderAttributeFilterDto>();
            foreach (var filterString in request.AttributeFilters)
            {
                var parts = filterString.Split(':', 2);
                if (parts.Length == 2 && Guid.TryParse(parts[0], out var attributeId))
                {
                    parsedFilters.Add(new ProviderAttributeFilterDto(attributeId, parts[1]));
                }
            }

            // For each attribute filter, we need to ensure the service provider has a matching attribute value
            for (var i = 0; i < parsedFilters.Count; i++)
            {
                var filter = parsedFilters[i];
                var attributeAlias = $"pa{i}";
                var attributeIdParam = $"AttributeId{i}";
                var attributeValueParam = $"AttributeValue{i}";

                baseFromBuilder.Append(
                    $@"
                    AND EXISTS (
                        SELECT 1
                        FROM category.provider_attributes {attributeAlias}
                        WHERE {attributeAlias}.service_provider_id = sp.id
                            AND {attributeAlias}.attribute_definition_id = @{attributeIdParam}
                            AND (
                                {attributeAlias}.value_translations ->> '{currentLocale}' ILIKE '%' || @{attributeValueParam} || '%'
                                OR {attributeAlias}.value_translations ->> '{defaultLocale}' ILIKE '%' || @{attributeValueParam} || '%'
                            )
                    )"
                );

                parameters.Add(attributeIdParam, filter.AttributeDefinitionId);
                parameters.Add(attributeValueParam, filter.Value);
            }
        }

        // Apply date range filters if provided
        if (request.StartDate.HasValue)
        {
            parameters.Add("StartDate", request.StartDate.Value);
            baseFromBuilder.Append(" AND sp.create_date >= @StartDate");
        }

        if (request.EndDate.HasValue)
        {
            parameters.Add("EndDate", request.EndDate.Value);
            baseFromBuilder.Append(" AND sp.create_date <= @EndDate");
        }
    }
}
