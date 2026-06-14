using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Location.Enumerations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCountries;

internal sealed class GetAvailableCountriesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetAvailableCountriesQuery, IReadOnlyCollection<GetAvailableCountriesResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetAvailableCountriesResponse>>> Handle(
        GetAvailableCountriesQuery request,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var countriesSql = $"""
            SELECT
                t.{nameof(GetAvailableCountriesResponse.Id)},
                t.{nameof(GetAvailableCountriesResponse.Code)},
                t.{nameof(GetAvailableCountriesResponse.Value)}
            FROM (
                SELECT DISTINCT
                    l.id AS {nameof(GetAvailableCountriesResponse.Id)},
                    l.code AS {nameof(GetAvailableCountriesResponse.Code)},
                    COALESCE(
                        l.value_translations ->> '{currentLocale}',
                        l.value_translations ->> '{defaultLocale}',
                        (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
                    ) AS {nameof(GetAvailableCountriesResponse.Value)},
                    l.display_order
                FROM category.locations l
                INNER JOIN category.service_providers sp ON sp.country = l.code
                WHERE sp.is_active = true
                    AND l.location_type_id = {LocationType.Country.Id}
            ) t
            ORDER BY t.display_order NULLS LAST, t.{nameof(GetAvailableCountriesResponse.Value)}
            """;

        var countries = await connection.QueryAsync<GetAvailableCountriesResponse>(
            new CommandDefinition(countriesSql, cancellationToken: cancellationToken)
        );

        return countries.AsList();
    }
}
