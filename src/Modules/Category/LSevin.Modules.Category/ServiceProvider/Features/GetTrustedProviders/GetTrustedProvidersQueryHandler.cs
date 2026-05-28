using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

internal sealed class GetTrustedProvidersQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetTrustedProvidersQuery, IPageList<GetTrustedProvidersResponse>>
{
    private static readonly List<string> _searchColumns = ["sp.name_translations", "sp.description_translations"];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetTrustedProvidersResponse.Name),
        nameof(GetTrustedProvidersResponse.IsActive),
        nameof(GetTrustedProvidersResponse.CreateDate),
    ];

    public async Task<Result<IPageList<GetTrustedProvidersResponse>>> Handle(
        GetTrustedProvidersQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

<<<<<<< HEAD

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        const string sql = """
SELECT
    sp.id AS Id,
    common.get_translation(sp.name_translations, @CurrentLocale, @DefaultLocale) AS Name,
    common.get_translation(sp.description_translations, @CurrentLocale, @DefaultLocale) AS Description,
    sp.email AS ContactEmail,
    sp.phone_number_country_code AS PhoneNumberCountryCode,
    sp.phone_number AS PhoneNumber,
    TRIM(
        CONCAT_WS(', ',
            NULLIF(common.get_translation(sp.street_translations, @CurrentLocale, @DefaultLocale), ''),
            NULLIF(common.get_translation(city_loc.value_translations, @CurrentLocale, @DefaultLocale), ''),
            NULLIF(common.get_translation(country_loc.value_translations, @CurrentLocale, @DefaultLocale), ''),
            NULLIF(sp.zip_code, ''),
            NULLIF(common.get_translation(sp.detail_translations, @CurrentLocale, @DefaultLocale), '')
        )
    ) AS Address,
    sp.is_active AS IsActive,
    sp.provider_type_id AS ProviderTypeId,
    common.get_translation(pt.name_translations, @CurrentLocale, @DefaultLocale) AS ProviderTypeName,
    COALESCE(svc.service_count, 0) AS ServiceCount,
    COALESCE(gal.gallery_item_count, 0) AS GalleryItemCount,
    COALESCE(pol.policy_count, 0) AS PolicyCount,
    COALESCE(stf.staff_count, 0) AS StaffCount,
    sp.create_date AS CreateDate,
    sp.last_modified_date AS LastModifiedDate,

    sp.accredited AS Verified,
    CASE
        WHEN sp.rating IS NULL THEN NULL
        ELSE ROUND(sp.rating)::int
    END AS Rating,
    COALESCE(bk.bookings, 0) AS Bookings,
    gr.growth AS Growth,
    COALESCE(pgi.url, sp.image_url) AS Image
FROM category.service_providers sp
LEFT JOIN category.provider_types pt
    ON pt.id = sp.provider_type_id
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
LEFT JOIN LATERAL (
    SELECT gi.url
    FROM category.provider_gallery_items gi
    WHERE gi.service_provider_id = sp.id
    ORDER BY gi.display_order ASC, gi.create_date ASC
    LIMIT 1
) pgi ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS service_count
    FROM category.provider_services ps
    WHERE ps.service_provider_id = sp.id
) svc ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS gallery_item_count
    FROM category.provider_gallery_items gi
    WHERE gi.service_provider_id = sp.id
) gal ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS policy_count
    FROM category.provider_policies pp
    WHERE pp.service_provider_id = sp.id
) pol ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS staff_count
    FROM category.provider_staffs psf
    WHERE psf.service_provider_id = sp.id
) stf ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS bookings
    FROM booking.bookings b
    WHERE b.provider_id = sp.id
) bk ON TRUE
LEFT JOIN LATERAL (
    SELECT
        CASE
            WHEN COUNT(parsed_growth) = 0 THEN NULL
            ELSE ROUND(AVG(parsed_growth))::int
        END AS growth
    FROM (
        SELECT
            CASE
                WHEN ps.growth IS NULL OR BTRIM(ps.growth) = '' THEN NULL::numeric
                WHEN substring(ps.growth from '[-+]?[0-9]*\.?[0-9]+') IS NULL THEN NULL::numeric
                ELSE (substring(ps.growth from '[-+]?[0-9]*\.?[0-9]+'))::numeric
            END AS parsed_growth
        FROM category.provider_services ps
        WHERE ps.service_provider_id = sp.id
    ) g
) gr ON TRUE
limit 10 ;
""";

        var items = await connection.QueryAsync<GetTrustedProvidersResponse>(
            new CommandDefinition(
                sql,
                new
                {
                    CurrentLocale = currentLocale,
                    DefaultLocale = defaultLocale
                },
                cancellationToken: cancellationToken
            )
        );




        return PageList<GetTrustedProvidersResponse>.Create(
            items.AsList(),
            request.PageNumber,
            request.PageSize,
            totalItems: 0
=======
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
            return PageList<GetTrustedProvidersResponse>.Empty;
        }

        // Data Query
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(request, _allowedSortColumns, "sp.id", ensureDeterministicOrder: true);

        dataQueryBuilder.AppendPaging(request, parameters);

        var serviceProviders = await connection.QueryAsync<GetTrustedProvidersResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );


   

        return PageList<GetTrustedProvidersResponse>.Create(
            serviceProviders.AsList(),
            request.PageNumber,
            request.PageSize,
            totalItems: totalCount
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        );
    }

    private string GetSelectClause()
    {
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        return $"""
<<<<<<< HEAD
            sp.id AS {nameof(GetTrustedProvidersResponse.Id)},
            COALESCE(
                sp.name_translations ->> '{currentLocale}',
                sp.name_translations ->> '{defaultLocale}',
                (sp.name_translations ->> (SELECT jsonb_object_keys(sp.name_translations) LIMIT 1))
            ) AS {nameof(GetTrustedProvidersResponse.Name)},
            COALESCE(
                sp.description_translations ->> '{currentLocale}',
                sp.description_translations ->> '{defaultLocale}',
                (sp.description_translations ->> (SELECT jsonb_object_keys(sp.description_translations) LIMIT 1))
            ) AS {nameof(GetTrustedProvidersResponse.Description)},
            pgi.url AS {nameof(GetTrustedProvidersResponse.Image)},
            sp.email AS {nameof(GetTrustedProvidersResponse.ContactEmail)},
            sp.phone_number_country_code AS {nameof(GetTrustedProvidersResponse.PhoneNumberCountryCode)},
            sp.phone_number AS {nameof(GetTrustedProvidersResponse.PhoneNumber)},
            CONCAT(
                COALESCE(
                    sp.street_translations ->> '{currentLocale}',
                    sp.street_translations ->> '{defaultLocale}',
                    (sp.street_translations ->> (SELECT jsonb_object_keys(sp.street_translations) LIMIT 1)),
                    ''
                ),
                ', ',
                sp.city,
                ', ',
                sp.country,
                ' ',
                sp.zip_code,
                ', ',
                COALESCE(
                    sp.detail_translations ->> '{currentLocale}',
                    sp.detail_translations ->> '{defaultLocale}',
                    (sp.detail_translations ->> (SELECT jsonb_object_keys(sp.detail_translations) LIMIT 1)),
                    ''
                )
            ) AS {nameof(GetTrustedProvidersResponse.Address)},
            sp.is_active AS {nameof(GetTrustedProvidersResponse.IsActive)},
            sp.provider_type_id AS {nameof(GetTrustedProvidersResponse.ProviderTypeId)},
            COALESCE(
                pt.name_translations ->> '{currentLocale}',
                pt.name_translations ->> '{defaultLocale}',
                (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
            ) AS {nameof(GetTrustedProvidersResponse.ProviderTypeName)},
            (SELECT COUNT(*)::int FROM category.provider_services WHERE service_provider_id = sp.id) AS {nameof(GetTrustedProvidersResponse.ServiceCount)},
            (SELECT COUNT(*)::int FROM category.provider_gallery_items WHERE service_provider_id = sp.id) AS {nameof(GetTrustedProvidersResponse.GalleryItemCount)},
            (SELECT COUNT(*)::int FROM category.provider_policies WHERE service_provider_id = sp.id) AS {nameof(GetTrustedProvidersResponse.PolicyCount)},
            (SELECT COUNT(*)::int FROM category.provider_staffs WHERE service_provider_id = sp.id) AS {nameof(GetTrustedProvidersResponse.StaffCount)},
            sp.create_date AS {nameof(GetTrustedProvidersResponse.CreateDate)},
            sp.last_modified_date AS {nameof(GetTrustedProvidersResponse.LastModifiedDate)}
        """;
    }
=======
                sp.id AS {nameof(GetTrustedProvidersResponse.Id)},
                COALESCE(
                    sp.name_translations ->> '{currentLocale}',
                    sp.name_translations ->> '{defaultLocale}',
                    (sp.name_translations ->> (SELECT jsonb_object_keys(sp.name_translations) LIMIT 1))
                ) AS {nameof(GetTrustedProvidersResponse.Name)},
                COALESCE(
                    sp.description_translations ->> '{currentLocale}',
                    sp.description_translations ->> '{defaultLocale}',
                    (sp.description_translations ->> (SELECT jsonb_object_keys(sp.description_translations) LIMIT 1))
                ) AS {nameof(GetTrustedProvidersResponse.Description)},
                sp.email AS {nameof(GetTrustedProvidersResponse.ContactEmail)},
                sp.phone_number_country_code AS {nameof(GetTrustedProvidersResponse.PhoneNumberCountryCode)},
                sp.phone_number AS {nameof(GetTrustedProvidersResponse.PhoneNumber)},
                CONCAT(
                    COALESCE(
                        sp.street_translations ->> '{currentLocale}',
                        sp.street_translations ->> '{defaultLocale}',
                        (sp.street_translations ->> (SELECT jsonb_object_keys(sp.street_translations) LIMIT 1)),
                        ''
                    ),
                    ', ',
                    sp.city,
                    ', ',
                    sp.country,
                    ' ',
                    sp.zip_code,
                    ', ',
                    COALESCE(
                        sp.detail_translations ->> '{currentLocale}',
                        sp.detail_translations ->> '{defaultLocale}',
                        (sp.detail_translations ->> (SELECT jsonb_object_keys(sp.detail_translations) LIMIT 1)),
                        ''
                    )
                ) AS {nameof(GetTrustedProvidersResponse.Address)},
                sp.is_active AS {nameof(GetTrustedProvidersResponse.IsActive)},
                sp.provider_type_id AS {nameof(GetTrustedProvidersResponse.ProviderTypeId)},
                COALESCE(
                    pt.name_translations ->> '{currentLocale}',
                    pt.name_translations ->> '{defaultLocale}',
                    (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
                ) AS {nameof(GetTrustedProvidersResponse.ProviderTypeName)},
                (SELECT COUNT(*)::int FROM category.provider_services WHERE service_provider_id = sp.id) AS {nameof(
                GetTrustedProvidersResponse.ServiceCount
            )},
                (SELECT COUNT(*)::int FROM category.provider_gallery_items WHERE service_provider_id = sp.id) AS {nameof(
                GetTrustedProvidersResponse.GalleryItemCount
            )},
                (SELECT COUNT(*)::int FROM category.provider_policies WHERE service_provider_id = sp.id) AS {nameof(
                GetTrustedProvidersResponse.PolicyCount
            )},
                (SELECT COUNT(*)::int FROM category.provider_staffs WHERE service_provider_id = sp.id) AS {nameof(
                GetTrustedProvidersResponse.StaffCount
            )},
                sp.create_date AS {nameof(GetTrustedProvidersResponse.CreateDate)},
                sp.last_modified_date AS {nameof(GetTrustedProvidersResponse.LastModifiedDate)}
            """;
    }

>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.service_providers sp
<<<<<<< HEAD
            LEFT JOIN category.provider_types pt
                ON pt.id = sp.provider_type_id
            LEFT JOIN LATERAL (
                SELECT gi.url
                FROM category.provider_gallery_items gi
                WHERE gi.service_provider_id = sp.id
                ORDER BY gi.display_order ASC, gi.create_date ASC
                LIMIT 1
            ) pgi ON TRUE
=======
            JOIN category.provider_types pt ON sp.provider_type_id = pt.id
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            """
        );
    }

    private static void ApplyFilters(
        StringBuilder baseFromBuilder,
        GetTrustedProvidersQuery request,
        DynamicParameters parameters
    )
    {
        // Filter by active status if specified
        if (request.IsActive.HasValue)
        {
            baseFromBuilder.AppendWhereOrAnd("sp.is_active = @IsActive");
            parameters.Add("IsActive", request.IsActive.Value);
        }

        if (request.ProviderTypeIds?.Length > 0)
        {
            baseFromBuilder.AppendWhereOrAnd("sp.provider_type_id = ANY(@ProviderTypeIds)");
            parameters.Add("ProviderTypeIds", request.ProviderTypeIds.ToArray());
        }

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            baseFromBuilder.AppendSearchFilter(request.Filters, _searchColumns, parameters, isJsonbColumn: true);
        }

        // Apply date range filters if provided
        if (request.StartDate.HasValue || request.EndDate.HasValue)
        {
            baseFromBuilder.AppendDateRange(request.StartDate, request.EndDate, "sp.create_date", parameters);
        }
    }
}
