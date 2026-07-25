using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Location.Enumerations;

namespace LSevin.Modules.Category.Location.Features.GetCitiesByCountry;

internal sealed class GetCitiesByCountryQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetCitiesByCountryQuery, IReadOnlyCollection<GetCitiesByCountryResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetCitiesByCountryResponse>>> Handle(
        GetCitiesByCountryQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        parameters.Add("CountryId", request.CountryId);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        // First check if the country exists
        var countryExists = await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                "SELECT EXISTS(SELECT 1 FROM category.locations WHERE id = @CountryId AND location_type_id = @LocationTypeId)",
                new { CountryId = request.CountryId, LocationTypeId = LocationType.Country.Id },
                cancellationToken: cancellationToken
            )
        );

        if (!countryExists)
        {
            return AppError.NotFoundErrorMessage(SharedResource.Country);
        }

        // Query all cities for the country
        var citiesSql = $"""
            SELECT
                l.id AS {nameof(GetCitiesByCountryResponse.Id)},
                l.code AS {nameof(GetCitiesByCountryResponse.Code)},
                COALESCE(
                    l.value_translations ->> '{currentLocale}',
                    l.value_translations ->> '{defaultLocale}',
                    (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
                ) AS {nameof(GetCitiesByCountryResponse.Value)},
                l.parent_id AS {nameof(GetCitiesByCountryResponse.ParentId)}
            FROM category.locations l
            LEFT JOIN category.locations parent ON parent.id = l.parent_id
            -- Cities hang off a province where the country has one, and off the country
            -- directly where it does not, so accept either shape.
            WHERE l.location_type_id = {LocationType.City.Id}
              AND (l.parent_id = @CountryId OR parent.parent_id = @CountryId)
            ORDER BY l.display_order NULLS LAST, COALESCE(
                l.value_translations ->> '{currentLocale}',
                l.value_translations ->> '{defaultLocale}',
                (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
            )
            """;

        var cities = await connection.QueryAsync<GetCitiesByCountryResponse>(
            new CommandDefinition(citiesSql, parameters, cancellationToken: cancellationToken)
        );

        return cities.AsList();
    }
}
