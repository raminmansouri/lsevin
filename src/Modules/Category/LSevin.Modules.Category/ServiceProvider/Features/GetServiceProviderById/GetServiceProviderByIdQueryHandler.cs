using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Dtos;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderById;

internal sealed class GetServiceProviderByIdQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceProviderByIdQuery, GetServiceProviderByIdResponse>
{
    public async Task<Result<GetServiceProviderByIdResponse>> Handle(
        GetServiceProviderByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        // Query the service provider basic details
        var serviceProviderSql = $"""
            SELECT
                sp.id AS Id,
                sp.name_translations AS NameTranslations,
                sp.description_translations AS DescriptionTranslations,
                sp.email AS ContactEmail,
                CONCAT(sp.phone_number_country_code, sp.phone_number) AS ContactPhone,
                sp.country AS Country,
                sp.city AS City,
                sp.street_translations AS StreetTranslations,
                sp.detail_translations AS DetailTranslations,
                sp.zip_code AS ZipCode,
                sp.longitude AS Longitude,
                sp.latitude AS Latitude,
                sp.is_active AS IsActive,
                sp.provider_type_id AS ProviderTypeId,
                COALESCE(
                    pt.name_translations ->> '{currentLocale}',
                    pt.name_translations ->> '{defaultLocale}',
                    (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
                ) AS ProviderTypeName,
                sp.grade_id AS GradeId,
                sp.create_date AS CreateDate,
                sp.last_modified_date AS LastModifiedDate
            FROM category.service_providers sp
            JOIN category.provider_types pt ON sp.provider_type_id = pt.id
            WHERE sp.id = @ServiceProviderId;
            """;

        await using var multi = await connection.QueryMultipleAsync(
            serviceProviderSql
                + $@"
            SELECT
                pa.id AS Id,
                pa.attribute_definition_id AS AttributeDefinitionId,
                COALESCE(
                    pad.name_translations ->> '{currentLocale}',
                    pad.name_translations ->> '{defaultLocale}',
                    (pad.name_translations ->> (SELECT jsonb_object_keys(pad.name_translations) LIMIT 1))
                ) AS AttributeName,
                pa.value_translations AS ValueTranslations
            FROM category.provider_attributes pa
            JOIN category.provider_attribute_definitions pad ON pa.attribute_definition_id = pad.id
            WHERE pa.service_provider_id = @ServiceProviderId;

            SELECT
                gi.id AS Id,
                gi.title_translations AS TitleTranslations,
                gi.description_translations AS DescriptionTranslations,
                gi.url AS Url,
                gi.media_type AS MediaType,
                gi.display_order AS DisplayOrder
            FROM category.provider_gallery_items gi
            WHERE gi.service_provider_id = @ServiceProviderId
            ORDER BY gi.display_order;

            SELECT
                pp.id AS Id,
                pp.type_translations AS TypeTranslations,
                pp.description_translations AS DescriptionTranslations
            FROM category.provider_policies pp
            WHERE pp.service_provider_id = @ServiceProviderId;

            SELECT
                ps.id AS Id,
                ps.service_definition_id AS ServiceDefinitionId,
                ps.duration_minutes AS DurationMinutes,
                ps.display_name_translations AS DisplayNameTranslations,
                ps.description_translations AS DescriptionTranslations,
                ps.is_active AS IsActive,
                ps.currency AS Currency,
                ps.value AS Value
            FROM category.provider_services ps
            WHERE ps.service_provider_id = @ServiceProviderId;

            SELECT
                ps.id AS Id,
                ps.staff_id AS StaffId,
                COALESCE(
                    s.name_translations ->> @currentLocale,
                    s.name_translations ->> @defaultLocale,
                    (s.name_translations ->> (SELECT jsonb_object_keys(s.name_translations) LIMIT 1))
                ) AS StaffName,
                COALESCE(
                    s.title_translations ->> @currentLocale,
                    s.title_translations ->> @defaultLocale,
                    (s.title_translations ->> (SELECT jsonb_object_keys(s.title_translations) LIMIT 1))
                ) AS StaffTitle,
                ps.notes_translations AS NotesTranslations,
                ps.is_active AS IsActive
            FROM category.provider_staffs ps
            JOIN category.staff s ON ps.staff_id = s.id
            WHERE ps.service_provider_id = @ServiceProviderId;",
            new
            {
                request.ServiceProviderId,
                currentLocale,
                defaultLocale,
            }
        );

        var serviceProviderRow = await multi.ReadSingleOrDefaultAsync<ServiceProviderRowDto>();

        if (serviceProviderRow is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        var attributeRows = await multi.ReadAsync<ProviderAttributeRowDto>();
        var galleryItemRows = await multi.ReadAsync<GalleryItemRowDto>();
        var policyRows = await multi.ReadAsync<PolicyRowDto>();
        var serviceRows = await multi.ReadAsync<ProviderServiceRowDto>();
        var staffRows = await multi.ReadAsync<ProviderStaffRowDto>();

        // Deserialize service provider JSONB fields
        var nameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            serviceProviderRow.NameTranslations ?? "{}"
        );
        var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            serviceProviderRow.DescriptionTranslations ?? "{}"
        );
        var streetTranslations = !string.IsNullOrEmpty(serviceProviderRow.StreetTranslations)
            ? JsonSerializer.Deserialize<Dictionary<string, string>>(serviceProviderRow.StreetTranslations)
            : null;
        var detailTranslations = !string.IsNullOrEmpty(serviceProviderRow.DetailTranslations)
            ? JsonSerializer.Deserialize<Dictionary<string, string>>(serviceProviderRow.DetailTranslations)
            : null;

        // Parse phone number if available
        string? phoneNumber = null;
        string? phoneNumberCountryCode = null;

        if (!string.IsNullOrEmpty(serviceProviderRow.ContactPhone))
        {
            // Parse phone format like "IR9126108806" -> country code "IR", number "9126108806"
            var phone = serviceProviderRow.ContactPhone;
            if (phone.Length > 2)
            {
                // First 2 characters are country code
                phoneNumberCountryCode = phone[..2];
                phoneNumber = phone[2..];
            }
        }

        // Map attributes
        var attributes = attributeRows
            .Select(attr =>
            {
                var valueTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    attr.ValueTranslations ?? "{}"
                );
                return new ServiceProviderAttributeDto(
                    attr.Id,
                    attr.AttributeDefinitionId,
                    attr.AttributeName,
                    LocalizedContentResponseDto.FromTranslations(valueTranslations ?? new())
                );
            })
            .ToList()
            .AsReadOnly();

        // Map gallery items
        var galleryItems = galleryItemRows
            .Select(gi =>
            {
                var titleTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    gi.TitleTranslations ?? "{}"
                );
                var descTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    gi.DescriptionTranslations ?? "{}"
                );
                return new ServiceProviderGalleryItemDto(
                    gi.Id,
                    LocalizedContentResponseDto.FromTranslations(titleTranslations ?? new()),
                    LocalizedContentResponseDto.FromTranslations(descTranslations ?? new()),
                    gi.Url,
                    gi.MediaType,
                    gi.DisplayOrder
                );
            })
            .ToList()
            .AsReadOnly();

        // Map policies
        var policies = policyRows
            .Select(policy =>
            {
                var typeTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    policy.TypeTranslations ?? "{}"
                );
                var descTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    policy.DescriptionTranslations ?? "{}"
                );
                return new ServiceProviderPolicyDto(
                    policy.Id,
                    LocalizedContentResponseDto.FromTranslations(typeTranslations ?? new()),
                    LocalizedContentResponseDto.FromTranslations(descTranslations ?? new())
                );
            })
            .ToList()
            .AsReadOnly();

        // Map services
        var services = serviceRows
            .Select(svc =>
            {
                var displayNameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    svc.DisplayNameTranslations ?? "{}"
                );
                var descTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    svc.DescriptionTranslations ?? "{}"
                );
                return new ServiceProviderServiceDto(
                    svc.Id,
                    svc.ServiceDefinitionId,
                    svc.DurationMinutes,
                    LocalizedContentResponseDto.FromTranslations(displayNameTranslations ?? new()),
                    LocalizedContentResponseDto.FromTranslations(descTranslations ?? new()),
                    svc.IsActive,
                    svc.Currency,
                    currencyService.ConvertPrice( svc.Value,svc.Currency)
                );
            })
            .ToList()
            .AsReadOnly();

        // Map staff
        var staff = staffRows
            .Select(st =>
            {
                var notesTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    st.NotesTranslations ?? "{}"
                );
                return new ServiceProviderStaffDto(
                    st.Id,
                    st.StaffId,
                    st.StaffName,
                    st.StaffTitle,
                    LocalizedContentResponseDto.FromTranslations(notesTranslations ?? new()),
                    st.IsActive
                );
            })
            .ToList()
            .AsReadOnly();

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

        // Construct the response object
        return new GetServiceProviderByIdResponse(
            serviceProviderRow.Id,
            LocalizedContentResponseDto.FromTranslations(nameTranslations ?? new()),
            LocalizedContentResponseDto.FromTranslations(descriptionTranslations ?? new()),
            serviceProviderRow.ContactEmail,
            phoneNumber,
            phoneNumberCountryCode,
            serviceProviderRow.Country,
            serviceProviderRow.City,
            streetTranslations != null ? LocalizedContentResponseDto.FromTranslations(streetTranslations) : null,
            detailTranslations != null ? LocalizedContentResponseDto.FromTranslations(detailTranslations) : null,
            serviceProviderRow.ZipCode,
            coordinates,
            serviceProviderRow.IsActive,
            serviceProviderRow.ProviderTypeId,
            serviceProviderRow.ProviderTypeName,
            serviceProviderRow.GradeId,
            attributes,
            galleryItems,
            policies,
            services,
            staff,
            serviceProviderRow.CreateDate,
            serviceProviderRow.LastModifiedDate
        );
    }
}

// Internal row DTOs for Dapper mapping
internal sealed record ServiceProviderRowDto(
    Guid Id,
    string NameTranslations,
    string DescriptionTranslations,
    string ContactEmail,
    string ContactPhone,
    string Country,
    string City,
    string? StreetTranslations,
    string? DetailTranslations,
    string ZipCode,
    decimal? Longitude,
    decimal? Latitude,
    bool IsActive,
    Guid ProviderTypeId,
    string ProviderTypeName,
    int? GradeId,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);

internal sealed record ProviderAttributeRowDto(
    Guid Id,
    Guid AttributeDefinitionId,
    string AttributeName,
    string ValueTranslations
);

internal sealed record GalleryItemRowDto(
    Guid Id,
    string TitleTranslations,
    string DescriptionTranslations,
    string Url,
    string MediaType,
    int DisplayOrder
);

internal sealed record PolicyRowDto(Guid Id, string TypeTranslations, string DescriptionTranslations);

internal sealed record ProviderServiceRowDto(
    Guid Id,
    Guid ServiceDefinitionId,
    int DurationMinutes,
    string DisplayNameTranslations,
    string DescriptionTranslations,
    bool IsActive,
    string Currency,
    decimal Value
);

internal sealed record ProviderStaffRowDto(
    Guid Id,
    Guid StaffId,
    string StaffName,
    string StaffTitle,
    string NotesTranslations,
    bool IsActive
);
