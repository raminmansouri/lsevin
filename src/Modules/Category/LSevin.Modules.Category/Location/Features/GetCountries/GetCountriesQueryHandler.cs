using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Location.Enumerations;

namespace LSevin.Modules.Category.Location.Features.GetCountries;

internal sealed class GetCountriesQueryHandler(IDbConnectionFactory dbConnectionFactory, ILocaleAccessor localeAccessor)
    : IQueryHandler<GetCountriesQuery, IReadOnlyCollection<GetCountriesResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetCountriesResponse>>> Handle(
        GetCountriesQuery request,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var countriesSql = $"""
            SELECT
                l.id AS {nameof(GetCountriesResponse.Id)},
                l.code AS {nameof(GetCountriesResponse.Code)},
                COALESCE(
                    l.value_translations ->> '{currentLocale}',
                    l.value_translations ->> '{defaultLocale}',
                    (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
                ) AS {nameof(GetCountriesResponse.Value)}
            FROM category.locations l
            WHERE l.location_type_id = {LocationType.Country.Id}
            ORDER BY l.display_order NULLS LAST, COALESCE(
                l.value_translations ->> '{currentLocale}',
                l.value_translations ->> '{defaultLocale}',
                (l.value_translations ->> (SELECT jsonb_object_keys(l.value_translations) LIMIT 1))
            )
            """;

        var countries = await connection.QueryAsync<GetCountriesResponse>(
            new CommandDefinition(countriesSql, cancellationToken: cancellationToken)
        );

        return countries.AsList();
    }
}
