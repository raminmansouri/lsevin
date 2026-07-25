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

internal sealed class GetServiceProviderByIdPublicQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceProviderByIdPublicQuery, GetServiceProviderByIdPublicResponse>
{
    public async Task<Result<GetServiceProviderByIdPublicResponse>> Handle(
        GetServiceProviderByIdPublicQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var serviceProviderSql =
            $@"
            SELECT
                sp.id AS Id,
                COALESCE(
                    sp.name_translations ->> '{currentLocale}',
                    sp.name_translations ->> '{defaultLocale}',
                    (sp.name_translations ->> (SELECT jsonb_object_keys(sp.name_translations) LIMIT 1))
                ) AS Name,
                COALESCE(
                    sp.description_translations ->> '{currentLocale}',
                    sp.description_translations ->> '{defaultLocale}',
                    (sp.description_translations ->> (SELECT jsonb_object_keys(sp.description_translations) LIMIT 1))
                ) AS Description,
                sp.email AS ContactEmail,
                sp.phone_number_country_code AS PhoneNumberCountryCode,
                sp.phone_number AS PhoneNumber,
                TRIM(
                    CONCAT_WS(', ',
                        NULLIF(COALESCE(
                            country_loc.value_translations ->> '{currentLocale}',
                            country_loc.value_translations ->> '{defaultLocale}',
                            (country_loc.value_translations ->> (SELECT jsonb_object_keys(country_loc.value_translations) LIMIT 1))
                        ), ''),
                        NULLIF(COALESCE(
                            city_loc.value_translations ->> '{currentLocale}',
                            city_loc.value_translations ->> '{defaultLocale}',
                            (city_loc.value_translations ->> (SELECT jsonb_object_keys(city_loc.value_translations) LIMIT 1))
                        ), ''),
                        NULLIF(COALESCE(
                            sp.street_translations ->> '{currentLocale}',
                            sp.street_translations ->> '{defaultLocale}',
                            (sp.street_translations ->> (SELECT jsonb_object_keys(sp.street_translations) LIMIT 1))
                        ), ''),
                        NULLIF(COALESCE(
                            sp.detail_translations ->> '{currentLocale}',
                            sp.detail_translations ->> '{defaultLocale}',
                            (sp.detail_translations ->> (SELECT jsonb_object_keys(sp.detail_translations) LIMIT 1))
                        ), '')
                    ) ||
                    CASE
                        WHEN sp.zip_code IS NOT NULL AND sp.zip_code != ''
                        THEN ' - ' || sp.zip_code
                        ELSE ''
                    END
                ) AS Address,
                sp.longitude AS Longitude,
                sp.latitude AS Latitude,
                sp.provider_type_id AS ProviderTypeId,
                COALESCE(
                    pt.name_translations ->> '{currentLocale}',
                    pt.name_translations ->> '{defaultLocale}',
                    (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
                ) AS ProviderTypeName
            FROM category.service_providers sp
            JOIN category.provider_types pt ON sp.provider_type_id = pt.id
            -- Without the tier filter these join every location sharing the code (a
            -- country and a province can both be 'TR'), fanning the single provider row
            -- out to several and making QuerySingleOrDefaultAsync below throw.
            LEFT JOIN category.locations country_loc
                ON country_loc.code = sp.country AND country_loc.location_type_id = 1
            LEFT JOIN category.locations city_loc
                ON city_loc.code = sp.city AND city_loc.location_type_id = 2
            WHERE sp.id = @ServiceProviderId AND sp.is_active = true
        ";

        var serviceProviderRow = await connection.QuerySingleOrDefaultAsync<ServiceProviderPublicRowDto>(
            new CommandDefinition(serviceProviderSql, parameters, cancellationToken: cancellationToken)
        );

        if (serviceProviderRow is null)
        {
            return AppError.NotFoundErrorMessage("Service provider");
        }

        // Map coordinates if both longitude and latitude are present
        CoordinatesDto? coordinates = null;
        if (serviceProviderRow.Longitude.HasValue && serviceProviderRow.Latitude.HasValue)
        {
            coordinates = new CoordinatesDto
            {
                Longitude = (double)serviceProviderRow.Longitude.Value,
                Latitude = (double)serviceProviderRow.Latitude.Value,
            };
        }

        var serviceProvider = new GetServiceProviderByIdPublicResponse
        {
            Id = serviceProviderRow.Id,
            Name = serviceProviderRow.Name,
            Description = serviceProviderRow.Description,
            ContactEmail = serviceProviderRow.ContactEmail,
            PhoneNumberCountryCode = serviceProviderRow.PhoneNumberCountryCode,
            PhoneNumber = serviceProviderRow.PhoneNumber,
            Address = serviceProviderRow.Address,
            Coordinates = coordinates,
            ProviderTypeName = serviceProviderRow.ProviderTypeName,
        };

        // Query attributes
        var attributesSql =
            $@"
            SELECT
                pa.id AS Id,
                pa.attribute_definition_id AS AttributeDefinitionId,
                COALESCE(
                    pad.name_translations ->> '{currentLocale}',
                    pad.name_translations ->> '{defaultLocale}',
                    (pad.name_translations ->> (SELECT jsonb_object_keys(pad.name_translations) LIMIT 1))
                ) AS AttributeName,
                COALESCE(
                    pa.value_translations ->> '{currentLocale}',
                    pa.value_translations ->> '{defaultLocale}',
                    (pa.value_translations ->> (SELECT jsonb_object_keys(pa.value_translations) LIMIT 1))
                ) AS Value
            FROM category.provider_attributes pa
            JOIN category.provider_attribute_definitions pad ON pa.attribute_definition_id = pad.id
            WHERE pa.service_provider_id = @ServiceProviderId
        ";

        var attributes = await connection.QueryAsync<ServiceProviderAttributeDto>(
            new CommandDefinition(
                attributesSql,
                new { request.ServiceProviderId },
                cancellationToken: cancellationToken
            )
        );

        serviceProvider.Attributes = attributes.AsList();

        // Query policies
        var policiesSql =
            $@"
            SELECT
                pp.id AS Id,
                COALESCE(
                    pp.type_translations ->> '{currentLocale}',
                    pp.type_translations ->> '{defaultLocale}',
                    (pp.type_translations ->> (SELECT jsonb_object_keys(pp.type_translations) LIMIT 1))
                ) AS PolicyTypeName,
                COALESCE(
                    pp.description_translations ->> '{currentLocale}',
                    pp.description_translations ->> '{defaultLocale}',
                    (pp.description_translations ->> (SELECT jsonb_object_keys(pp.description_translations) LIMIT 1))
                ) AS Description
            FROM category.provider_policies pp
            WHERE pp.service_provider_id = @ServiceProviderId
        ";

        var policies = await connection.QueryAsync<ServiceProviderPolicyDto>(
            new CommandDefinition(policiesSql, new { request.ServiceProviderId }, cancellationToken: cancellationToken)
        );

        serviceProvider.Policies = policies.AsList();

        // Query gallery items
        var gallerySql =
            $@"
            SELECT
                id AS Id,
                COALESCE(
                    title_translations ->> '{currentLocale}',
                    title_translations ->> '{defaultLocale}',
                    (title_translations ->> (SELECT jsonb_object_keys(title_translations) LIMIT 1))
                ) AS Title,
                url AS Url,
                media_type AS MediaType,
                display_order AS DisplayOrder
            FROM category.provider_gallery_items
            WHERE service_provider_id = @ServiceProviderId
            ORDER BY display_order ASC
        ";

        var galleryItems = await connection.QueryAsync<ServiceProviderGalleryItemDto>(
            new CommandDefinition(gallerySql, new { request.ServiceProviderId }, cancellationToken: cancellationToken)
        );

        serviceProvider.Gallery = galleryItems.AsList();

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
            WHERE service_provider_id = @ServiceProviderId AND is_active = true
            ORDER BY display_name_translations ->> '{currentLocale}', display_name_translations ->> '{defaultLocale}'
        ";

        var services = await connection.QueryAsync<ServiceProviderServiceDto>(
            new CommandDefinition(servicesSql, new { request.ServiceProviderId }, cancellationToken: cancellationToken)
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

        // Query staff
        var staffSql =
            $@"
            SELECT
                ps.id AS Id,
                ps.staff_id AS StaffId,
                COALESCE(
                    s.name_translations ->> '{currentLocale}',
                    s.name_translations ->> '{defaultLocale}',
                    (s.name_translations ->> (SELECT jsonb_object_keys(s.name_translations) LIMIT 1))
                ) AS StaffName,
                COALESCE(
                    s.title_translations ->> '{currentLocale}',
                    s.title_translations ->> '{defaultLocale}',
                    (s.title_translations ->> (SELECT jsonb_object_keys(s.title_translations) LIMIT 1))
                ) AS StaffTitle,
                COALESCE(
                    s.biography_translations ->> '{currentLocale}',
                    s.biography_translations ->> '{defaultLocale}',
                    (s.biography_translations ->> (SELECT jsonb_object_keys(s.biography_translations) LIMIT 1))
                ) AS StaffBiography,
                s.profile_image_url AS ProfileImageUrl,
                COALESCE(
                    ps.notes_translations ->> '{currentLocale}',
                    ps.notes_translations ->> '{defaultLocale}',
                    (ps.notes_translations ->> (SELECT jsonb_object_keys(ps.notes_translations) LIMIT 1))
                ) AS Notes,
                ps.is_active AS IsActive
            FROM category.provider_staffs ps
            JOIN category.staff s ON ps.staff_id = s.id
            WHERE ps.service_provider_id = @ServiceProviderId AND ps.is_active = true AND s.is_active = true
            ORDER BY s.name_translations ->> '{currentLocale}', s.name_translations ->> '{defaultLocale}'
        ";

        var staff = await connection.QueryAsync<ServiceProviderStaffDto>(
            new CommandDefinition(staffSql, new { request.ServiceProviderId }, cancellationToken: cancellationToken)
        );

        serviceProvider.Staff = staff.AsList();

        return serviceProvider;
    }
}

internal sealed record ServiceProviderPublicRowDto(
    Guid Id,
    string Name,
    string Description,
    string ContactEmail,
    string? PhoneNumberCountryCode,
    string? PhoneNumber,
    string? Address,
    decimal? Longitude,
    decimal? Latitude,
    Guid ProviderTypeId,
    string ProviderTypeName
);
