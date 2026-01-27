using System.Data;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersPublic;

internal sealed class GetServiceProvidersPublicQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceProvidersPublicQuery, IReadOnlyCollection<GetServiceProvidersPublicResponse>>
{
    private static readonly List<string> _searchColumns = ["sp.name_translations", "sp.description_translations"];

    public async Task<Result<IReadOnlyCollection<GetServiceProvidersPublicResponse>>> Handle(
        GetServiceProvidersPublicQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        // Build the main query with ROW_NUMBER to get the top 10 per provider type
        var mainSql = BuildMainQuery();
        ApplyFilters(ref mainSql, request, parameters);

        // Execute the main query to get grouped service providers
        var serviceProvidersData = await connection.QueryAsync<ServiceProviderRowData>(
            new CommandDefinition(mainSql, parameters, cancellationToken: cancellationToken)
        );

        var serviceProvidersList = serviceProvidersData.AsList();

        if (serviceProvidersList.Count == 0)
        {
            return Array.Empty<GetServiceProvidersPublicResponse>();
        }

        // Get attributes for all service providers in one query
        var providerIds = serviceProvidersList.Select(sp => sp.Id).Distinct().ToArray();
        var attributes = await GetServiceProviderAttributes(connection, providerIds, cancellationToken);

        // Group attributes by service provider
        var attributesByProvider = attributes
            .GroupBy(a => a.ServiceProviderId)
            .ToDictionary(
                g => g.Key,
                g => g.Take(3).Select(a => new ServiceProviderAttributeItemDto(a.Id, a.AttributeName, a.Value)).ToList()
            );

        // Group by provider type and build response
        var groupedResults = serviceProvidersList
            .GroupBy(sp => new { sp.ProviderTypeId, sp.ProviderTypeName })
            .Select(group => new GetServiceProvidersPublicResponse(
                group.Key.ProviderTypeId,
                group.Key.ProviderTypeName,
                group.Count(),
                [
                    .. group.Select(sp => new ServiceProvidersPublicDto
                    {
                        Id = sp.Id,
                        Name = sp.Name,
                        MinimumServicePrice = sp.MinimumServicePrice,
                        Currency = sp.Currency,
                        ThumbnailUrl = sp.ThumbnailUrl,
                        Grade = sp.Grade,
                        Attributes = attributesByProvider.GetValueOrDefault(sp.Id, []),
                    }),
                ]
            ))
            .ToList();

        return groupedResults;
    }

    private string BuildMainQuery()
    {
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        return $"""
            WITH ranked_providers AS (
                SELECT
                    sp.id,
                    COALESCE(
                        sp.name_translations ->> '{currentLocale}',
                        sp.name_translations ->> '{defaultLocale}',
                        (sp.name_translations ->> (SELECT jsonb_object_keys(sp.name_translations) LIMIT 1))
                    ) AS name,
                    sp.provider_type_id,
                    COALESCE(
                        pt.name_translations ->> '{currentLocale}',
                        pt.name_translations ->> '{defaultLocale}',
                        (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
                    ) as provider_type_name,
                    (
                        SELECT MIN(ps.value)
                        FROM category.provider_services ps
                        WHERE ps.service_provider_id = sp.id
                    ) AS minimum_service_price,
                    (
                        SELECT ps.currency
                        FROM category.provider_services ps
                        WHERE ps.service_provider_id = sp.id
                        ORDER BY ps.value ASC
                        LIMIT 1
                    ) AS currency,
                    (
                        SELECT pgi.url
                        FROM category.provider_gallery_items pgi
                        WHERE pgi.service_provider_id = sp.id
                        ORDER BY pgi.display_order ASC
                        LIMIT 1
                    ) AS thumbnail_url,
                    spg.name AS Grade,
                    ROW_NUMBER() OVER (PARTITION BY sp.provider_type_id ORDER BY sp.grade_id ASC, sp.create_date DESC) as rn
                FROM category.service_providers sp
                INNER JOIN category.provider_types pt ON sp.provider_type_id = pt.id
                LEFT JOIN category.locations country_loc ON country_loc.code = sp.country
                LEFT JOIN category.locations city_loc ON city_loc.code = sp.city
                LEFT JOIN category.service_provider_grades spg ON sp.grade_id = spg.id
                WHERE sp.is_active = true AND pt.is_active = true
            )
            SELECT
                id AS Id,
                name AS Name,
                provider_type_id AS ProviderTypeId,
                provider_type_name AS ProviderTypeName,
                minimum_service_price AS MinimumServicePrice,
                currency AS Currency,
                thumbnail_url AS ThumbnailUrl,
                grade AS Grade
            FROM ranked_providers
            WHERE rn <= 10
            """;
    }

    private static void ApplyFilters(
        ref string sql,
        GetServiceProvidersPublicQuery request,
        DynamicParameters parameters
    )
    {
        var whereConditions = new List<string>();

        // Filter by country code if specified
        if (!string.IsNullOrWhiteSpace(request.CountryCode))
        {
            whereConditions.Add("sp.country = @CountryCode");
            parameters.Add("CountryCode", request.CountryCode);
        }

        // Filter by city code if specified
        if (!string.IsNullOrWhiteSpace(request.CityCode))
        {
            whereConditions.Add("sp.city = @CityCode");
            parameters.Add("CityCode", request.CityCode);
        }

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            var searchConditions = _searchColumns.Select(column =>
                $"EXISTS (SELECT 1 FROM jsonb_each_text({column}) WHERE value ILIKE '%' || @Search || '%')"
            );
            whereConditions.Add($"({string.Join(" OR ", searchConditions)})");
            parameters.Add("Search", request.Filters);
        }

        // Add WHERE clause if there are any additional filters
        if (whereConditions.Count > 0)
        {
            // Insert additional conditions into the CTE
            var additionalWhere = " AND " + string.Join(" AND ", whereConditions);
            sql = sql.Replace(
                "WHERE sp.is_active = true AND pt.is_active = true",
                "WHERE sp.is_active = true AND pt.is_active = true" + additionalWhere,
                StringComparison.Ordinal
            );
        }
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

    private sealed class ServiceProviderRowData
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = null!;
        public Guid ProviderTypeId { get; init; }
        public string ProviderTypeName { get; init; } = null!;
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
}
