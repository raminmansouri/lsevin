using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetFeaturedServicesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetFeaturedServicesQuery, GetFeaturedServicesResponse>
{
    public async Task<Result<GetFeaturedServicesResponse>> Handle(
        GetFeaturedServicesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var serviceProvider = new GetFeaturedServicesResponse
        {
        };

        const string servicesSql = """
    SELECT
        ps.id AS Id,
        ps.service_definition_id AS ServiceDefinitionId,

        common.get_translation_t(
            ps.display_name_translations,
            @CurrentLocale,
            @DefaultLocale
        ) AS DisplayName,

        common.get_translation_t(
            ps.description_translations,
            @CurrentLocale,
            @DefaultLocale
        ) AS Description,

        COALESCE(
            NULLIF(BTRIM(ps.image_url), ''),
            pgi.url
        ) AS Url,

        COALESCE(
            NULLIF(BTRIM(ps.image_url), ''),
            pgi.url
        ) AS Image,

        common.get_translation_t(
            sp.name_translations,
            @CurrentLocale,
            @DefaultLocale
        ) AS ProviderName,

        TRIM(
            CONCAT_WS(', ',
                NULLIF(common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale), ''),
                NULLIF(common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale), '')
            )
        ) AS Location,

        ps.is_active AS IsActive,
        ps.currency AS Currency,
        ps.value AS Value,

        offer.discount AS Discount,
        ps.review_count::numeric AS Reviews,
        ps.rating::numeric AS Rating

    FROM category.provider_services ps
    LEFT JOIN category.service_providers sp
        ON sp.id = ps.service_provider_id
    LEFT JOIN category.locations country_loc
        ON country_loc.code = sp.country
       AND country_loc.location_type_id = 1
    LEFT JOIN category.locations city_loc
        ON city_loc.code = sp.city
       AND city_loc.location_type_id = 2
    LEFT JOIN LATERAL (
        SELECT gi.url
        FROM category.provider_gallery_items gi
        WHERE gi.service_provider_id = ps.service_provider_id
        ORDER BY gi.display_order ASC, gi.create_date ASC
        LIMIT 1
    ) pgi ON TRUE
    LEFT JOIN LATERAL (
        SELECT MAX(o.discount_percent)::numeric AS discount
        FROM marketing.offers o
        WHERE o.provider_service_id = ps.id
          AND COALESCE(o.is_active, TRUE) = TRUE
          AND o.valid_until > NOW()
    ) offer ON TRUE
    WHERE ps.is_active = TRUE
    ORDER BY
        common.get_translation_t(
            ps.display_name_translations,
            @CurrentLocale,
            @DefaultLocale
        )
    LIMIT 10;
    """; 

        var services = await connection.QueryAsync<ServiceProviderServiceDto>(
            new CommandDefinition(
                servicesSql,
                new
                {
                    CurrentLocale = currentLocale,
                    DefaultLocale = defaultLocale
                },
                cancellationToken: cancellationToken
            )
        );

        if (services != null)
        {
            foreach (var serviceProviderServiceDto in services)
            {
                serviceProviderServiceDto.Value =
                    currencyService.ConvertPrice(
                        serviceProviderServiceDto.Value,
                        serviceProviderServiceDto.Currency
                    );

                serviceProviderServiceDto.Currency =
                    currencyService.ConvertCurrencySymbol(
                        serviceProviderServiceDto.Currency
                    );
            }

            serviceProvider.Services = services.AsList();
        }

        return serviceProvider;


        return serviceProvider;
    }
}



