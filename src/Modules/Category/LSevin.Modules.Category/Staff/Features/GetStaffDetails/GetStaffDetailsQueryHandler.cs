using System.Text.Json;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Dtos;

namespace LSevin.Modules.Category.Staff.Features.GetStaffDetails;

internal sealed class GetStaffDetailsQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetStaffDetailsQuery, GetStaffDetailsResponse>
{
    public async Task<Result<GetStaffDetailsResponse>> Handle(
        GetStaffDetailsQuery request,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var sql =
            @"
            SELECT
                s.id AS Id,
                s.name_translations AS NameTranslations,
                s.biography_translations AS BiographyTranslations,
                s.title_translations AS TitleTranslations,
                s.profile_image_url AS ProfileImageUrl,
                s.is_active AS IsActive,
                s.create_date AS CreateDate,
                s.last_modified_date AS LastModifiedDate
            FROM category.staff s
            WHERE s.id = @StaffId;

            SELECT
                sa.id AS Id,
                sa.day_of_week AS DayOfWeek,
                sa.start_time AS StartTime,
                sa.end_time AS EndTime,
                sa.is_recurring AS IsRecurring,
                sa.specific_date AS SpecificDate,
                sa.availability_status_id AS AvailabilityStatusId,
                sas.name AS AvailabilityStatusName,
                sa.create_date AS CreateDate,
                sa.last_modified_date AS LastModifiedDate
            FROM category.staff_availabilities sa
            JOIN category.staff_availability_statuses sas ON sa.availability_status_id = sas.id
            WHERE sa.staff_id = @StaffId
            ORDER BY sa.day_of_week, sa.start_time;

            SELECT
                ss.id AS Id,
                ss.service_definition_id AS ServiceDefinitionId,
                sd.name AS ServiceName,
                sd.description AS ServiceDescription,
                sd.value AS Price,
                sd.duration_minutes AS DurationInMinutes,
                ss.is_active AS IsActive,
                ss.notes_translations AS NotesTranslations,
                ss.create_date AS CreateDate,
                ss.last_modified_date AS LastModifiedDate
            FROM category.staff_services ss
            JOIN category.service_definitions sd ON ss.service_definition_id = sd.id
            WHERE ss.staff_id = @StaffId
            ORDER BY sd.name;";

        await using var multi = await connection.QueryMultipleAsync(sql, new { request.StaffId });

        var staffRow = await multi.ReadSingleOrDefaultAsync<StaffRowDto>();
        if (staffRow == null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        // Deserialize JSONB strings to dictionaries
        var nameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            staffRow.NameTranslations ?? "{}"
        );
        var biographyTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            staffRow.BiographyTranslations ?? "{}"
        );
        var titleTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            staffRow.TitleTranslations ?? "{}"
        );

        var availabilities = await multi.ReadAsync<StaffAvailabilityDto>();
        var serviceRows = await multi.ReadAsync<ServiceRowDto>();

        // Map services with localized notes
        var services = serviceRows
            .Select(sr =>
            {
                var notesTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    sr.NotesTranslations ?? "{}"
                );

                return new StaffServiceDetailsDto(
                    sr.Id,
                    sr.ServiceDefinitionId,
                    sr.ServiceName,
                    sr.ServiceDescription,
                    sr.Price,
                    sr.DurationInMinutes,
                    sr.IsActive,
                    LocalizedContentResponseDto.FromTranslations(notesTranslations ?? new()),
                    sr.CreateDate,
                    sr.LastModifiedDate
                );
            })
            .ToList();

        return new GetStaffDetailsResponse(
            staffRow.Id,
            LocalizedContentResponseDto.FromTranslations(nameTranslations ?? new()),
            LocalizedContentResponseDto.FromTranslations(biographyTranslations ?? new()),
            LocalizedContentResponseDto.FromTranslations(titleTranslations ?? new()),
            staffRow.ProfileImageUrl,
            staffRow.IsActive,
            staffRow.CreateDate,
            staffRow.LastModifiedDate,
            availabilities.ToList().AsReadOnly(),
            services.AsReadOnly()
        );
    }
}

// Internal DTO for Dapper mapping
internal sealed record StaffRowDto(
    Guid Id,
    string NameTranslations,
    string BiographyTranslations,
    string TitleTranslations,
    string? ProfileImageUrl,
    bool IsActive,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);

internal sealed record ServiceRowDto(
    Guid Id,
    Guid ServiceDefinitionId,
    string ServiceName,
    string? ServiceDescription,
    decimal Price,
    int DurationInMinutes,
    bool IsActive,
    string NotesTranslations,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
