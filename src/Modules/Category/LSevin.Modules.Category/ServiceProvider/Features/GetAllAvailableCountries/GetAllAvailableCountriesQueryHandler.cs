using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Location.Enumerations;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCountries;

internal sealed class GetAllAvailableCountriesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetAllAvailableCountriesQuery, IReadOnlyCollection<GetAllAvailableCountriesResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetAllAvailableCountriesResponse>>> Handle(
        GetAllAvailableCountriesQuery request,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var countriesSql = $"""
            SELECT
                l.id AS {nameof(GetAllAvailableCountriesResponse.Id)},
                l.code AS {nameof(GetAllAvailableCountriesResponse.Code)},
                COALESCE(
                    l.value_translations ->> '{currentLocale}',
                    l.value_translations ->> '{defaultLocale}',
                    (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
                ) AS {nameof(GetAllAvailableCountriesResponse.Value)}
            FROM category.locations l
            WHERE l.location_type_id = {LocationType.Country.Id}
            ORDER BY l.display_order NULLS LAST, COALESCE(
                l.value_translations ->> '{currentLocale}',
                l.value_translations ->> '{defaultLocale}',
                (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
            )
            """;

        var countries = await connection.QueryAsync<GetAllAvailableCountriesResponse>(
            new CommandDefinition(countriesSql, cancellationToken: cancellationToken)
        );

        return countries.AsList();
    }
}
