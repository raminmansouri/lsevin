using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Location.Enumerations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCitiesByCountry;

internal sealed class GetAllAvailableCitiesByCountryQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetAllAvailableCitiesByCountryQuery, IReadOnlyCollection<GetAllAvailableCitiesByCountryResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetAllAvailableCitiesByCountryResponse>>> Handle(
        GetAllAvailableCitiesByCountryQuery request,
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

        // Query all cities for the country
        var citiesSql = $"""
            SELECT
                l.id AS {nameof(GetAllAvailableCitiesByCountryResponse.Id)},
                l.code AS {nameof(GetAllAvailableCitiesByCountryResponse.Code)},
                COALESCE(
                    l.value_translations ->> '{currentLocale}',
                    l.value_translations ->> '{defaultLocale}',
                    (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
                ) AS {nameof(GetAllAvailableCitiesByCountryResponse.Value)},
                l.parent_id AS {nameof(GetAllAvailableCitiesByCountryResponse.ParentId)}
            FROM category.locations l
            LEFT JOIN category.locations l_parent ON l_parent.id = l.parent_id
            INNER JOIN category.locations country_l
                ON country_l.code = @CountryCode
                AND country_l.location_type_id = {LocationType.Country.Id}
            WHERE l.location_type_id = {LocationType.City.Id}
                -- A city hangs off a province where the country has one, and off the
                -- country directly where it does not, so accept either hop.
                AND (l.parent_id = country_l.id OR l_parent.parent_id = country_l.id)
            ORDER BY l.display_order NULLS LAST, COALESCE(
                l.value_translations ->> '{currentLocale}',
                l.value_translations ->> '{defaultLocale}',
                (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
            )
            """;

        var cities = await connection.QueryAsync<GetAllAvailableCitiesByCountryResponse>(
            new CommandDefinition(citiesSql, parameters, cancellationToken: cancellationToken)
        );

        return cities.AsList();
    }
}
