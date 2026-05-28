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

<<<<<<< HEAD
using Dapper;

=======
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
internal sealed class GetTrendingServicesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetTrendingServicesQuery, GetTrendingServicesResponse>
{
    public async Task<Result<GetTrendingServicesResponse>> Handle(
        GetTrendingServicesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
<<<<<<< HEAD

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var parameters = new DynamicParameters();
        parameters.Add("CurrentLocale", currentLocale);
        parameters.Add("DefaultLocale", defaultLocale);
        parameters.Add("Take", 10);

        var response = new GetTrendingServicesResponse
        {
            Title = "Trending Services",
            Services = new List<TrendingServiceDto>()
        };

        const string sql = """
SELECT
    ps.id AS Id,
    ps.service_definition_id AS ServiceDefinitionId,
    common.get_translation(
        ps.display_name_translations,
        @CurrentLocale,
        @DefaultLocale
    ) AS DisplayName,
    common.get_translation(
        ps.description_translations,
        @CurrentLocale,
        @DefaultLocale
    ) AS Description,
    COALESCE(
        NULLIF(BTRIM(ps.image_url), ''),
        pgi.url
    ) AS Url,
    common.get_translation(
        sp.name_translations,
        @CurrentLocale,
        @DefaultLocale
    ) AS ProviderName,
    TRIM(
        CONCAT_WS(', ',
            NULLIF(common.get_translation(city_loc.value_translations, @CurrentLocale, @DefaultLocale), ''),
            NULLIF(common.get_translation(country_loc.value_translations, @CurrentLocale, @DefaultLocale), '')
        )
    ) AS Location,
    ps.is_active AS IsActive,
    ps.currency AS Currency,
    ps.value AS Value,
    offer.discount AS Discount,
    ps.review_count::numeric AS Reviews,
    CASE
        WHEN ps.growth IS NULL OR BTRIM(ps.growth) = '' THEN NULL
        WHEN substring(ps.growth from '[-+]?[0-9]*\.?[0-9]+') IS NULL THEN NULL
        ELSE (substring(ps.growth from '[-+]?[0-9]*\.?[0-9]+'))::numeric
    END AS Growth,
    ps.rating::numeric AS Rating,
    COALESCE(bk.bookings, 0)::numeric AS Bookings,
    ps.is_popular AS IsPopular,
    ps.recovery AS Recovery,
    ps.anesthesia AS Anesthesia,
    ps.stay_required AS StayRequired
FROM category.provider_services ps
LEFT JOIN category.service_providers sp
    ON sp.id = ps.service_provider_id
LEFT JOIN category.service_definitions sd
    ON sd.id = ps.service_definition_id
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
LEFT JOIN LATERAL (
    SELECT COUNT(*)::numeric AS bookings
    FROM booking.bookings b
    WHERE b.service_id = ps.id
) bk ON TRUE
WHERE ps.is_active = TRUE
ORDER BY
    COALESCE(ps.trending_score, 0) DESC,
    COALESCE(ps.is_popular, FALSE) DESC,
    COALESCE(ps.rating, 0) DESC,
    COALESCE(ps.review_count, 0) DESC,
    ps.create_date DESC
LIMIT @Take;
""";

        var rows = (
            await connection.QueryAsync<TrendingServiceRow>(
                new CommandDefinition(sql, parameters, cancellationToken: cancellationToken)
            )
        ).AsList();

        var services = new List<TrendingServiceDto>(rows.Count);

        foreach (var row in rows)
        {
            var service = new TrendingServiceDto
            {
                Id = row.Id,
                ServiceDefinitionId = row.ServiceDefinitionId,
                DisplayName = row.DisplayName,
                Description = row.Description,
                Url = row.Url,
                ProviderName = row.ProviderName,
                Location = row.Location,
                IsActive = row.IsActive,
                Currency = currencyService.ConvertCurrencySymbol(row.Currency),
                Value = currencyService.ConvertPrice(row.Value, row.Currency),
                Discount = row.Discount,
                Reviews = row.Reviews,
                Growth = row.Growth,
                Rating = row.Rating,
                Bookings = row.Bookings,
                Badges = new List<ServiceBadgeDto>(),
                Features = new List<ServiceFeatureDto>()
            };

            if (row.IsPopular)
            {
                service.Badges.Add(new ServiceBadgeDto
                {
                    Name = "Popular"
                });
            }

            if (row.Discount.HasValue && row.Discount.Value > 0)
            {
                service.Badges.Add(new ServiceBadgeDto
                {
                    Name = $"{row.Discount.Value:0.#}% Off"
                });
            }

            if (!string.IsNullOrWhiteSpace(row.Recovery))
            {
                service.Features.Add(new ServiceFeatureDto
                {
                    Name = $"Recovery: {row.Recovery}"
                });
            }

            if (!string.IsNullOrWhiteSpace(row.Anesthesia))
            {
                service.Features.Add(new ServiceFeatureDto
                {
                    Name = $"Anesthesia: {row.Anesthesia}"
                });
            }

            if (!string.IsNullOrWhiteSpace(row.StayRequired))
            {
                service.Features.Add(new ServiceFeatureDto
                {
                    Name = $"Stay: {row.StayRequired}"
                });
            }

            services.Add(service);
        }

        response.Services = services;
        return response;
    }

    private sealed class TrendingServiceRow
    {
        public Guid Id { get; init; }
        public Guid ServiceDefinitionId { get; init; }
        public string DisplayName { get; init; } = null!;
        public string? Description { get; init; }
        public string? Url { get; init; }
        public string? ProviderName { get; init; }
        public string? Location { get; init; }
        public bool IsActive { get; init; }
        public string Currency { get; init; } = null!;
        public decimal Value { get; init; }
        public decimal? Discount { get; init; }
        public decimal? Reviews { get; init; }
        public decimal? Growth { get; init; }
        public decimal? Rating { get; init; }
        public decimal? Bookings { get; init; }

        public bool IsPopular { get; init; }
        public string? Recovery { get; init; }
        public string? Anesthesia { get; init; }
        public string? StayRequired { get; init; }
    }
}
=======
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;



        var serviceProvider = new GetTrendingServicesResponse
        {
           Title=""
        };


        

        // Query services
        var servicesSql =
            $@"
            SELECT
                id AS Id,
                service_definition_id AS ServiceDefinitionId,
                duration_minutes AS DurationMinutes,
                COALESCE(
                    display_name_translations ->> '{currentLocale}',
                    display_name_translations ->> '{defaultLocale}',
                    (display_name_translations ->> (SELECT jsonb_object_keys(display_name_translations) LIMIT 1))
                ) AS DisplayName,
                COALESCE(
                    description_translations ->> '{currentLocale}',
                    description_translations ->> '{defaultLocale}',
                    (description_translations ->> (SELECT jsonb_object_keys(description_translations) LIMIT 1))
                ) AS Description,
                is_active AS IsActive,
                currency AS Currency,
                value AS Value
            FROM category.provider_services
            WHERE is_active = true
            ORDER BY display_name_translations ->> '{currentLocale}', display_name_translations ->> '{defaultLocale}'
 limit 10
        ";

        var services = await connection.QueryAsync<TrendingServiceDto>(
            new CommandDefinition(servicesSql, new {  }, cancellationToken: cancellationToken)
        );

        if (services != null)
        {
            foreach (var serviceProviderServiceDto in services)
            {
                serviceProviderServiceDto.Value =
                    currencyService.ConvertPrice(serviceProviderServiceDto.Value, serviceProviderServiceDto?.Currency);

                serviceProviderServiceDto.Currency =
                    currencyService.ConvertCurrencySymbol(serviceProviderServiceDto?.Currency);

           }

            serviceProvider.Services = services.AsList();
        }


        return serviceProvider;
    }
}

>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
