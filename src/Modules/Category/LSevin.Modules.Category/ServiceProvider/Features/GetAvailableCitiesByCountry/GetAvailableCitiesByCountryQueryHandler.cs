using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Location.Enumerations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCitiesByCountry;

internal sealed class GetAvailableCitiesByCountryQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetAvailableCitiesByCountryQuery, IReadOnlyCollection<GetAvailableCitiesByCountryResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetAvailableCitiesByCountryResponse>>> Handle(
        GetAvailableCitiesByCountryQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        parameters.Add("CountryCode", request.CountryCode);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        // First check if the country exists
        var countryExists = await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                "SELECT EXISTS(SELECT 1 FROM category.locations WHERE code = @CountryCode AND location_type_id = @LocationTypeId)",
                new { CountryCode = request.CountryCode, LocationTypeId = LocationType.Country.Id },
                cancellationToken: cancellationToken
            )
        );

        if (!countryExists)
        {
            return AppError.NotFoundErrorMessage(SharedResource.Country);
        }

        // Query cities for the country that have active service providers
        var citiesSql = $"""
            SELECT
                t.{nameof(GetAvailableCitiesByCountryResponse.Id)},
                t.{nameof(GetAvailableCitiesByCountryResponse.Code)},
                t.{nameof(GetAvailableCitiesByCountryResponse.Value)},
                t.{nameof(GetAvailableCitiesByCountryResponse.ParentId)}
            FROM (
                SELECT DISTINCT
                    l.id AS {nameof(GetAvailableCitiesByCountryResponse.Id)},
                    l.code AS {nameof(GetAvailableCitiesByCountryResponse.Code)},
                    COALESCE(
                        l.value_translations ->> '{currentLocale}',
                        l.value_translations ->> '{defaultLocale}',
                        (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
                    ) AS {nameof(GetAvailableCitiesByCountryResponse.Value)},
                    l.parent_id AS {nameof(GetAvailableCitiesByCountryResponse.ParentId)},
                    l.display_order
                FROM category.locations l
                LEFT JOIN category.locations l_parent ON l_parent.id = l.parent_id
                INNER JOIN category.service_providers sp ON sp.city = l.code
                INNER JOIN category.locations country_l
                    ON country_l.code = @CountryCode
                    AND country_l.location_type_id = {LocationType.Country.Id}
                    AND sp.country = country_l.code
                WHERE sp.is_active = true
                    AND l.location_type_id = {LocationType.City.Id}
                    -- A city hangs off a province where the country has one, and off the
                    -- country directly where it does not, so accept either hop.
                    AND (l.parent_id = country_l.id OR l_parent.parent_id = country_l.id)
            ) t
            ORDER BY t.display_order NULLS LAST, t.{nameof(GetAvailableCitiesByCountryResponse.Value)}
            """;

        var cities = await connection.QueryAsync<GetAvailableCitiesByCountryResponse>(
            new CommandDefinition(citiesSql, parameters, cancellationToken: cancellationToken)
        );

        return cities.AsList();
    }
}
