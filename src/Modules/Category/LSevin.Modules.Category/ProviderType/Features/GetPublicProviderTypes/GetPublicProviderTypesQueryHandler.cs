using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;

namespace LSevin.Modules.Category.ProviderType.Features.GetPublicProviderTypes;

internal sealed class GetPublicProviderTypesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetPublicProviderTypesQuery, IReadOnlyList<GetPublicProviderTypesResponse>>
{
    public async Task<Result<IReadOnlyList<GetPublicProviderTypesResponse>>> Handle(
        GetPublicProviderTypesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var sql = $"""
            SELECT
                pt.id AS {nameof(GetPublicProviderTypesResponse.Id)},
                COALESCE(
                    pt.name_translations ->> '{currentLocale}',
                    pt.name_translations ->> '{defaultLocale}',
                    (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
                ) AS {nameof(GetPublicProviderTypesResponse.Name)},
                COALESCE(
                    pt.description_translations ->> '{currentLocale}',
                    pt.description_translations ->> '{defaultLocale}',
                    (pt.description_translations ->> (SELECT jsonb_object_keys(pt.description_translations) LIMIT 1))
                ) AS {nameof(GetPublicProviderTypesResponse.Description)},
                pt.icon_url AS {nameof(GetPublicProviderTypesResponse.IconUrl)}
            FROM category.provider_types pt
            ORDER BY pt.name_translations
            """;

        var providerTypes = await connection.QueryAsync<GetPublicProviderTypesResponse>(
            new CommandDefinition(sql, cancellationToken: cancellationToken)
        );

        return providerTypes.AsList();
    }
}
