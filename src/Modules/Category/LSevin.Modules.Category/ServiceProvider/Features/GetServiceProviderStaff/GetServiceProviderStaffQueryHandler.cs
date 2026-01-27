using System.Text;
using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderStaff;

internal sealed class GetServiceProviderStaffQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceProviderStaffQuery, IReadOnlyCollection<GetServiceProviderStaffResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetServiceProviderStaffResponse>>> Handle(
        GetServiceProviderStaffQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // First check if the service provider exists
        var serviceProviderExists = await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                "SELECT EXISTS(SELECT 1 FROM category.service_providers WHERE id = @ServiceProviderId)",
                parameters,
                cancellationToken: cancellationToken
            )
        );

        if (!serviceProviderExists)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        // Build the query with optional filters
        var sql = new StringBuilder();
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        sql.Append(
            $"""
            SELECT
                ps.id AS {nameof(ProviderStaffRowDto.Id)},
                COALESCE(SPLIT_PART(
                    COALESCE(
                        s.name_translations ->> '{currentLocale}',
                        s.name_translations ->> '{defaultLocale}',
                        (s.name_translations ->> (SELECT jsonb_object_keys(s.name_translations) LIMIT 1))
                    ), ' ', 1), '') AS {nameof(ProviderStaffRowDto.FirstName)},
                COALESCE(SPLIT_PART(
                    COALESCE(
                        s.name_translations ->> '{currentLocale}',
                        s.name_translations ->> '{defaultLocale}',
                        (s.name_translations ->> (SELECT jsonb_object_keys(s.name_translations) LIMIT 1))
                    ), ' ', 2), '') AS {nameof(ProviderStaffRowDto.LastName)},
                COALESCE(
                    s.name_translations ->> '{currentLocale}',
                    s.name_translations ->> '{defaultLocale}',
                    (s.name_translations ->> (SELECT jsonb_object_keys(s.name_translations) LIMIT 1))
                ) AS {nameof(ProviderStaffRowDto.DisplayName)},
                s.profile_image_url AS {nameof(ProviderStaffRowDto.ProfileImageUrl)},
                COALESCE(
                    s.biography_translations ->> '{currentLocale}',
                    s.biography_translations ->> '{defaultLocale}',
                    (s.biography_translations ->> (SELECT jsonb_object_keys(s.biography_translations) LIMIT 1))
                ) AS {nameof(ProviderStaffRowDto.Description)},
                '' AS {nameof(ProviderStaffRowDto.Gender)},
                COALESCE(
                    s.title_translations ->> '{currentLocale}',
                    s.title_translations ->> '{defaultLocale}',
                    (s.title_translations ->> (SELECT jsonb_object_keys(s.title_translations) LIMIT 1))
                ) AS {nameof(ProviderStaffRowDto.JobTitle)},
                '' AS {nameof(ProviderStaffRowDto.Email)},
                '' AS {nameof(ProviderStaffRowDto.PhoneNumber)},
                ps.notes_translations AS {nameof(ProviderStaffRowDto.NotesTranslations)},
                s.is_active AS {nameof(ProviderStaffRowDto.IsActive)},
                s.create_date AS {nameof(ProviderStaffRowDto.CreateDate)},
                s.last_modified_date AS {nameof(ProviderStaffRowDto.LastModifiedDate)}
            FROM category.staff s
            JOIN category.provider_staffs ps ON s.id = ps.staff_id
            WHERE ps.service_provider_id = @ServiceProviderId
            """
        );

        if (request.IsActive.HasValue)
        {
            sql.Append(" AND s.is_active = @IsActive");
            parameters.Add("IsActive", request.IsActive.Value);
        }

        parameters.Add("currentLocale", currentLocale);
        parameters.Add("defaultLocale", defaultLocale);

        sql.Append(
            $" ORDER BY COALESCE("
                + $"s.name_translations ->> @currentLocale, "
                + $"s.name_translations ->> @defaultLocale, "
                + $"(s.name_translations ->> (SELECT jsonb_object_keys(s.name_translations) LIMIT 1))"
                + $")"
        );

        var staffRows = await connection.QueryAsync<ProviderStaffRowDto>(
            new CommandDefinition(sql.ToString(), parameters, cancellationToken: cancellationToken)
        );

        // Map staff with deserialized JSONB fields
        var staff = staffRows
            .Select(row =>
            {
                return new GetServiceProviderStaffResponse(
                    row.Id,
                    row.FirstName,
                    row.LastName,
                    row.DisplayName,
                    row.ProfileImageUrl,
                    row.Description,
                    row.Gender,
                    row.JobTitle,
                    row.Email,
                    row.PhoneNumber,
                    row.IsActive,
                    row.CreateDate,
                    row.LastModifiedDate
                );
            })
            .ToList();

        return staff;
    }
}

// Internal row DTO for Dapper mapping
internal sealed record ProviderStaffRowDto(
    Guid Id,
    string FirstName,
    string LastName,
    string DisplayName,
    string? ProfileImageUrl,
    string? Description,
    string Gender,
    string JobTitle,
    string Email,
    string PhoneNumber,
    string NotesTranslations,
    bool IsActive,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
